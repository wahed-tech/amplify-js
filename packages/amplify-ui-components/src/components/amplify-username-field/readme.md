# amplify-username-field

<!-- Auto Generated Below -->


## Properties

| Property            | Attribute     | Description                                                                                                        | Type                                | Default                             |
| ------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------ | ----------------------------------- | ----------------------------------- |
| `disabled`          | `disabled`    | Will disable the input if set to true                                                                              | `boolean`                           | `undefined`                         |
| `fieldId`           | `field-id`    | Based on the type of field e.g. sign in, sign up, forgot password, etc.                                            | `string`                            | `USERNAME_SUFFIX`                   |
| `handleInputChange` | --            | The callback, called when the input is modified by the user.                                                       | `(inputEvent: Event) => void`       | `undefined`                         |
| `hint`              | `hint`        | Used for the hint text that displays underneath the input field                                                    | `FunctionalComponent<{}> \| string` | `undefined`                         |
| `inputProps`        | --            | Attributes places on the input element: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#Attributes | `object`                            | `undefined`                         |
| `label`             | `label`       | Used for the username label                                                                                        | `string`                            | `Translations.USERNAME_LABEL`       |
| `placeholder`       | `placeholder` | Used for the placeholder label                                                                                     | `string`                            | `Translations.USERNAME_PLACEHOLDER` |
| `required`          | `required`    | The required flag in order to make an input required prior to submitting a form                                    | `boolean`                           | `false`                             |
| `value`             | `value`       | The value of the content inside of the input field                                                                 | `string`                            | `undefined`                         |


## Dependencies

### Used by

 - [amplify-auth-fields](../amplify-auth-fields)

### Depends on

- [amplify-form-field](../amplify-form-field)

### Graph
```mermaid
graph TD;
  amplify-username-field --> amplify-form-field
  amplify-form-field --> amplify-label
  amplify-form-field --> amplify-input
  amplify-form-field --> amplify-hint
  amplify-auth-fields --> amplify-username-field
  style amplify-username-field fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
