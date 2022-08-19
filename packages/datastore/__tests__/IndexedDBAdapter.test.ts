import Adapter from '../src/storage/adapter/IndexedDBAdapter';
import 'fake-indexeddb/auto';
import {
	DataStore as DataStoreType,
	initSchema as initSchemaType,
	syncClasses,
} from '../src/datastore/datastore';
import { PersistentModelConstructor, SortDirection } from '../src/types';
import {
	pause,
	expectMutation,
	Model,
	User,
	Profile,
	Post,
	Comment,
	testSchema,
} from './helpers';
import { Predicates } from '../src/predicates';
import { addCommonQueryTests } from './commonAdapterTests';

let initSchema: typeof initSchemaType;
let DataStore: typeof DataStoreType;
// using any to get access to private methods
const IDBAdapter = <any>Adapter;

describe('IndexedDBAdapter tests', () => {
	async function getMutations(adapter) {
		await pause(250);
		return await adapter.getAll('sync_MutationEvent');
	}

	async function clearOutbox(adapter) {
		await pause(250);
		return await adapter.delete(syncClasses['MutationEvent']);
	}

	({ initSchema, DataStore } = require('../src/datastore/datastore'));
	addCommonQueryTests({
		initSchema,
		DataStore,
		storageAdapter: Adapter,
		getMutations,
		clearOutbox,
	});

	describe('Query', () => {
		let Model: PersistentModelConstructor<Model>;
		let model1Id: string;

		const spyOnGetOne = jest.spyOn(IDBAdapter, 'getById');
		const spyOnGetAll = jest.spyOn(IDBAdapter, 'getAll');
		const spyOnEngine = jest.spyOn(IDBAdapter, 'enginePagination');
		const spyOnMemory = jest.spyOn(IDBAdapter, 'inMemoryPagination');

		beforeAll(async () => {
			({ initSchema, DataStore } = require('../src/datastore/datastore'));
			DataStore.configure({ storageAdapter: Adapter });

			const classes = initSchema(testSchema());

			({ Model } = classes as {
				Model: PersistentModelConstructor<Model>;
			});

			// NOTE: sort() test on these models can be flaky unless we
			// strictly control the datestring of each! In a non-negligible percentage
			// of test runs on a reasonably fast machine, DataStore.save() seemed to return
			// quickly enough that dates were colliding. (or so it seemed!)

			const baseDate = new Date();

			await DataStore.start();
			await DataStore.clear();

			({ id: model1Id } = await DataStore.save(
				new Model({
					field1: 'field1 value 0',
					dateCreated: baseDate.toISOString(),
				})
			));
			await DataStore.save(
				new Model({
					field1: 'field1 value 1',
					dateCreated: new Date(baseDate.getTime() + 1).toISOString(),
				})
			);
			await DataStore.save(
				new Model({
					field1: 'field1 value 2',
					dateCreated: new Date(baseDate.getTime() + 2).toISOString(),
				})
			);
		});

		beforeEach(() => {
			jest.clearAllMocks();
		});

		it('Should call getById for query by id', async () => {
			const result = await DataStore.query(Model, model1Id);

			expect(result.field1).toEqual('field1 value 0');
			expect(spyOnGetOne).toHaveBeenCalled();
			expect(spyOnGetAll).not.toHaveBeenCalled();
			expect(spyOnEngine).not.toHaveBeenCalled();
			expect(spyOnMemory).not.toHaveBeenCalled();
		});

		it('Should call getAll & inMemoryPagination for query with a predicate', async () => {
			const results = await DataStore.query(Model, c =>
				c.field1('eq', 'field1 value 1')
			);

			expect(results.length).toEqual(1);
			expect(spyOnGetAll).toHaveBeenCalled();
			expect(spyOnEngine).not.toHaveBeenCalled();
			expect(spyOnMemory).toHaveBeenCalled();
		});

		it('Should call getAll & inMemoryPagination for query with sort', async () => {
			const results = await DataStore.query(Model, Predicates.ALL, {
				sort: s => s.dateCreated(SortDirection.DESCENDING),
			});

			expect(results.length).toEqual(3);
			expect(results[0].field1).toEqual('field1 value 2');
			expect(spyOnGetAll).toHaveBeenCalled();
			expect(spyOnEngine).not.toHaveBeenCalled();
			expect(spyOnMemory).toHaveBeenCalled();
		});

		it('Should call enginePagination for query with pagination but no sort or predicate', async () => {
			const results = await DataStore.query(Model, Predicates.ALL, {
				limit: 1,
			});

			expect(results.length).toEqual(1);
			expect(spyOnGetAll).not.toHaveBeenCalled();
			expect(spyOnEngine).toHaveBeenCalled();
			expect(spyOnMemory).not.toHaveBeenCalled();
		});

		it('Should call getAll for query without predicate and pagination', async () => {
			const results = await DataStore.query(Model);

			expect(results.length).toEqual(3);
			expect(spyOnGetAll).toHaveBeenCalled();
			expect(spyOnEngine).not.toHaveBeenCalled();
			expect(spyOnMemory).not.toHaveBeenCalled();
		});
	});

	describe('Delete', () => {
		let User: PersistentModelConstructor<User>;
		let Profile: PersistentModelConstructor<Profile>;
		let profile1Id: string;
		let user1Id: string;

		beforeAll(async () => {
			({ initSchema, DataStore } = require('../src/datastore/datastore'));

			const classes = initSchema(testSchema());

			({ User } = classes as {
				User: PersistentModelConstructor<User>;
			});

			({ Profile } = classes as {
				Profile: PersistentModelConstructor<Profile>;
			});

			({ id: profile1Id } = await DataStore.save(
				new Profile({ firstName: 'Rick', lastName: 'Bob' })
			));

			({ id: user1Id } = await DataStore.save(
				new User({ name: 'test', profileID: profile1Id })
			));
		});

		it('Should perform a cascading delete on a record with a Has One relationship', async () => {
			let user = await DataStore.query(User, user1Id);
			let profile = await DataStore.query(Profile, profile1Id);

			// double-checking that both of the records exist at first
			expect(user.id).toEqual(user1Id);
			expect(profile.id).toEqual(profile1Id);

			await DataStore.delete(User, user1Id);

			user = await DataStore.query(User, user1Id);
			profile = await DataStore.query(Profile, profile1Id);

			// both should be undefined, even though we only explicitly deleted the user
			expect(user).toBeUndefined;
			expect(profile).toBeUndefined;
		});
	});
});
