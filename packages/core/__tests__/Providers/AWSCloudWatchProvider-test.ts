import { AWSCloudWatchProvider } from '../../src/Providers/AWSCloudWatchProvider';
import { AWSCloudWatchProviderOptions } from '../../src/types';
import {
	AWS_CLOUDWATCH_CATEGORY,
	AWS_CLOUDWATCH_PROVIDER_NAME,
	NO_CREDS_ERROR_STRING,
} from '../../src/Util/Constants';
import { Credentials } from '../..';
import {
	CloudWatchLogsClient,
	CreateLogGroupCommand,
	CreateLogStreamCommand,
	DescribeLogGroupsCommand,
	DescribeLogStreamsCommand,
	PutLogEventsCommand,
} from '@aws-sdk/client-cloudwatch-logs';

const credentials = {
	accessKeyId: 'accessKeyId',
	sessionToken: 'sessionToken',
	secretAccessKey: 'secretAccessKey',
	identityId: 'identityId',
	authenticated: true,
};

const testConfig: AWSCloudWatchProviderOptions = {
	logGroupName: 'logGroup',
	logStreamName: 'logStream',
	region: 'us-west-2',
};

describe('AWSCloudWatchProvider', () => {
	it('should initiate a timer when the provider is created', () => {
		const timer_spy = jest.spyOn(
			AWSCloudWatchProvider.prototype,
			'_initiateLogPushInterval'
		);
		const provider = new AWSCloudWatchProvider();
		expect(timer_spy).toBeCalled();
	});

	describe('getCategoryName()', () => {
		it('should return the AWS_CLOUDWATCH_CATEGORY', () => {
			const provider = new AWSCloudWatchProvider();
			expect(provider.getCategoryName()).toBe(AWS_CLOUDWATCH_CATEGORY);
		});
	});

	describe('getProviderName()', () => {
		it('should return the AWS_CLOUDWATCH_PROVIDER_NAME', () => {
			const provider = new AWSCloudWatchProvider();
			expect(provider.getProviderName()).toBe(AWS_CLOUDWATCH_PROVIDER_NAME);
		});
	});

	describe('configure()', () => {
		it('should return a config with logGroupName, logStreamName, and region when given a config input', () => {
			const provider = new AWSCloudWatchProvider();
			const config = provider.configure(testConfig);

			expect(config).toStrictEqual(testConfig);
			expect(config).toHaveProperty('logGroupName');
			expect(config).toHaveProperty('logStreamName');
			expect(config).toHaveProperty('region');
		});

		it('should return an empty object when given no config input', () => {
			const provider = new AWSCloudWatchProvider();
			expect(provider.configure()).toStrictEqual({});
		});
	});

	describe('credentials test', () => {
		it('should throw an error when no credentials', async () => {
			const provider = new AWSCloudWatchProvider();
			provider.configure(testConfig);
			const spyon = jest.spyOn(Credentials, 'get').mockImplementation(() => {
				return Promise.reject('err');
			});

			const action = async () => {
				await provider.createLogGroup({
					logGroupName: testConfig.logGroupName,
				});
			};

			expect.assertions(1);
			await expect(action()).rejects.toThrowError(Error(NO_CREDS_ERROR_STRING));
			spyon.mockRestore();
		});
	});

	describe('CloudWatch api tests', () => {
		beforeEach(() => {
			jest.spyOn(Credentials, 'get').mockImplementation(() => {
				return Promise.resolve(credentials);
			});
		});

		describe('createLogGroup test', () => {
			const createLogGroupParams = { logGroupName: 'group-name' };

			it('should send a valid request to the client without error', async () => {
				const provider = new AWSCloudWatchProvider(testConfig);
				const clientSpy = jest
					.spyOn(CloudWatchLogsClient.prototype, 'send')
					.mockImplementationOnce(async params => {
						return 'data';
					});

				await provider.createLogGroup(createLogGroupParams);
				expect(clientSpy.mock.calls[0][0].input).toEqual(createLogGroupParams);

				clientSpy.mockRestore();
			});
		});

		describe('createLogStream test', () => {
			const params = {
				logGroupName: 'group-name',
				logStreamName: 'stream-name',
			};

			it('should send a valid request to the client without error', async () => {
				const provider = new AWSCloudWatchProvider(testConfig);
				const clientSpy = jest
					.spyOn(CloudWatchLogsClient.prototype, 'send')
					.mockImplementationOnce(async params => {
						return 'data';
					});

				await provider.createLogStream(params);
				expect(clientSpy.mock.calls[0][0].input).toEqual(params);

				clientSpy.mockRestore();
			});
		});

		describe('getLogGroups test', () => {
			const params = {
				logGroupNamePrefix: 'group-name',
			};

			it('should send a valid request to the client without error', async () => {
				const provider = new AWSCloudWatchProvider(testConfig);
				const clientSpy = jest
					.spyOn(CloudWatchLogsClient.prototype, 'send')
					.mockImplementationOnce(async params => {
						return 'data';
					});

				await provider.getLogGroups(params);
				expect(clientSpy.mock.calls[0][0].input).toEqual(params);

				clientSpy.mockRestore();
			});
		});

		describe('getLogStreams test', () => {
			const params = {
				logGroupName: 'group-name',
				logStreamNamePrefix: 'stream-name',
			};

			it('should send a valid request to the client without error', async () => {
				const provider = new AWSCloudWatchProvider(testConfig);
				const clientSpy = jest
					.spyOn(CloudWatchLogsClient.prototype, 'send')
					.mockImplementationOnce(async params => {
						return 'data';
					});

				await provider.getLogStreams(params);
				expect(clientSpy.mock.calls[0][0].input).toEqual(params);

				clientSpy.mockRestore();
			});
		});

		describe('pushLogs test', () => {
			it('should add the provided logs to the log queue', () => {
				const provider = new AWSCloudWatchProvider(testConfig);
				provider.pushLogs([{ message: 'hello', timestamp: 1111 }]);

				let logQueue = provider.getLogQueue();

				expect(logQueue).toHaveLength(1);

				provider.pushLogs([
					{
						message: 'goodbye',
						timestamp: 1112,
					},
					{
						message: 'ohayou',
						timestamp: 1113,
					},
					{
						message: 'konbanwa',
						timestamp: 1114,
					},
				]);

				logQueue = provider.getLogQueue();

				expect(logQueue).toHaveLength(4);
			});
		});

		describe('_safeUploadLogEvents test', () => {
			it('should send a valid request to the client without error', async () => {
				const params = [{ message: 'hello', timestamp: 1111 }];
				const provider = new AWSCloudWatchProvider(testConfig);
				const clientSpy = jest
					.spyOn(CloudWatchLogsClient.prototype, 'send')
					.mockImplementation(async params => 'data');

				provider['_currentLogBatch'] = params;
				await provider['_safeUploadLogEvents']();

				expect(clientSpy.mock.calls[0][0]).toBeInstanceOf(
					DescribeLogGroupsCommand
				);
				expect(clientSpy.mock.calls[0][0].input).toEqual({
					logGroupNamePrefix: testConfig.logGroupName,
				});

				expect(clientSpy.mock.calls[1][0]).toBeInstanceOf(
					CreateLogGroupCommand
				);
				expect(clientSpy.mock.calls[1][0].input).toEqual({
					logGroupName: testConfig.logGroupName,
				});

				expect(clientSpy.mock.calls[2][0]).toBeInstanceOf(
					DescribeLogStreamsCommand
				);
				expect(clientSpy.mock.calls[2][0].input).toEqual({
					logGroupName: testConfig.logGroupName,
					logStreamNamePrefix: testConfig.logStreamName,
				});

				expect(clientSpy.mock.calls[3][0]).toBeInstanceOf(
					CreateLogStreamCommand
				);
				expect(clientSpy.mock.calls[3][0].input).toEqual({
					logGroupName: testConfig.logGroupName,
					logStreamName: testConfig.logStreamName,
				});

				expect(clientSpy.mock.calls[4][0]).toBeInstanceOf(PutLogEventsCommand);
				expect(clientSpy.mock.calls[4][0].input).toEqual({
					logGroupName: testConfig.logGroupName,
					logStreamName: testConfig.logStreamName,
					logEvents: params,
					sequenceToken: undefined,
				});

				clientSpy.mockRestore();
			});

			it('should send a valid request when log group exists', async () => {
				const params = [{ message: 'hello', timestamp: 1111 }];
				const provider = new AWSCloudWatchProvider(testConfig);
				const clientSpy = jest
					.spyOn(CloudWatchLogsClient.prototype, 'send')
					.mockImplementationOnce(async params => ({
						logGroups: [{ logGroupName: testConfig.logGroupName }],
					}))
					.mockImplementation(async params => 'data');

				provider['_currentLogBatch'] = params;
				await provider['_safeUploadLogEvents']();

				expect(clientSpy.mock.calls[0][0]).toBeInstanceOf(
					DescribeLogGroupsCommand
				);
				expect(clientSpy.mock.calls[0][0].input).toEqual({
					logGroupNamePrefix: testConfig.logGroupName,
				});

				expect(clientSpy.mock.calls[1][0]).toBeInstanceOf(
					DescribeLogStreamsCommand
				);
				expect(clientSpy.mock.calls[1][0].input).toEqual({
					logGroupName: testConfig.logGroupName,
					logStreamNamePrefix: testConfig.logStreamName,
				});

				expect(clientSpy.mock.calls[2][0]).toBeInstanceOf(
					CreateLogStreamCommand
				);
				expect(clientSpy.mock.calls[2][0].input).toEqual({
					logGroupName: testConfig.logGroupName,
					logStreamName: testConfig.logStreamName,
				});

				expect(clientSpy.mock.calls[3][0]).toBeInstanceOf(PutLogEventsCommand);
				expect(clientSpy.mock.calls[3][0].input).toEqual({
					logGroupName: testConfig.logGroupName,
					logStreamName: testConfig.logStreamName,
					logEvents: params,
					sequenceToken: undefined,
				});

				clientSpy.mockRestore();
			});

			it('should send a valid request when empty log stream exists', async () => {
				const params = [{ message: 'hello', timestamp: 1111 }];
				const provider = new AWSCloudWatchProvider(testConfig);
				const clientSpy = jest
					.spyOn(CloudWatchLogsClient.prototype, 'send')
					.mockImplementationOnce(async params => ({
						logGroups: [{ logGroupName: testConfig.logGroupName }],
					}))
					.mockImplementationOnce(async params => ({
						logStreams: [{ logStreamName: testConfig.logStreamName }],
					}))
					.mockImplementation(async params => 'data');

				provider['_currentLogBatch'] = params;
				await provider['_safeUploadLogEvents']();

				expect(clientSpy.mock.calls[0][0]).toBeInstanceOf(
					DescribeLogGroupsCommand
				);
				expect(clientSpy.mock.calls[0][0].input).toEqual({
					logGroupNamePrefix: testConfig.logGroupName,
				});

				expect(clientSpy.mock.calls[1][0]).toBeInstanceOf(
					DescribeLogStreamsCommand
				);
				expect(clientSpy.mock.calls[1][0].input).toEqual({
					logGroupName: testConfig.logGroupName,
					logStreamNamePrefix: testConfig.logStreamName,
				});

				expect(clientSpy.mock.calls[2][0]).toBeInstanceOf(PutLogEventsCommand);
				expect(clientSpy.mock.calls[2][0].input).toEqual({
					logGroupName: testConfig.logGroupName,
					logStreamName: testConfig.logStreamName,
					logEvents: params,
					sequenceToken: undefined,
				});

				clientSpy.mockRestore();
			});

			it('should send a valid request when non-empty log stream exists', async () => {
				const params = [{ message: 'hello', timestamp: 1111 }];
				const sequenceToken = '123';
				const provider = new AWSCloudWatchProvider(testConfig);
				const clientSpy = jest
					.spyOn(CloudWatchLogsClient.prototype, 'send')
					.mockImplementationOnce(async params => ({
						logGroups: [{ logGroupName: testConfig.logGroupName }],
					}))
					.mockImplementationOnce(async params => ({
						logStreams: [
							{
								logStreamName: testConfig.logStreamName,
								uploadSequenceToken: sequenceToken,
							},
						],
					}))
					.mockImplementation(async params => 'data');

				provider['_currentLogBatch'] = params;
				await provider['_safeUploadLogEvents']();

				expect(clientSpy.mock.calls[0][0]).toBeInstanceOf(
					DescribeLogGroupsCommand
				);
				expect(clientSpy.mock.calls[0][0].input).toEqual({
					logGroupNamePrefix: testConfig.logGroupName,
				});

				expect(clientSpy.mock.calls[1][0]).toBeInstanceOf(
					DescribeLogStreamsCommand
				);
				expect(clientSpy.mock.calls[1][0].input).toEqual({
					logGroupName: testConfig.logGroupName,
					logStreamNamePrefix: testConfig.logStreamName,
				});

				expect(clientSpy.mock.calls[2][0]).toBeInstanceOf(PutLogEventsCommand);
				expect(clientSpy.mock.calls[2][0].input).toEqual({
					logGroupName: testConfig.logGroupName,
					logStreamName: testConfig.logStreamName,
					logEvents: params,
					sequenceToken,
				});

				clientSpy.mockRestore();
			});
		});
	});
});
