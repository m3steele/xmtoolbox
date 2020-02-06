# xm-toolbox

<aside class="notice">
This package is a work in progress. Currently updating JSDocs to properly document functions and adding sync module functionality.
</aside>

## Simple To Use

xmtoolbox is designed to simplify the interactions with xMatters APIs and includes other helper functions such as synchronization from a file and between xMatters instances.

```js
const xm = require('../xmtoolbox');
const prod = xm.environments.create('SUBDOMAIN', 'USER', 'PASSWORD');

GetPerson(prod, 'jsmith'); //person with jsmith username
async function GetPerson(env, id) {
  const person = await xm.people.get(env, id, { embed: 'devices' });
}
```

## Installation

        npm install xmtoolbox

## Setup

1.  Create user with 'Web Service User Role` for each xMatters Instance
2.  Follow Examples to leverage package.
3.  Setup an xMatters environment for each instance you are interacting with. This is an example of one:

        const xm = require('../xmtoolbox');

        //xMatters username and password stored as environment variables.
        const SUBDOMAIN = process.env.SUBDOMAIN; // https://SUBDOMAIN.xmatters.com
        const USERNAME = process.env.USERNAME;
        const PASSWORD = process.env.PASSWORD;
        const options = {logLevel: 'debug'};

        const prod = xm.environments.create(SUBDOMAIN, USERNAME, PASSWORD, options);

## Examples

### REST API Examples

#### Get User with Devices

        const person = await xm.people.get(prod, 'amunster', { embed: 'devices' });
        console.log(person.firstName); //Arnold

#### Get Users with Devices and Roles

        // matches weblogin and email for @example.com
        const query = { embed: 'roles,devices', search: '@example.com' };
        const people = await xm.people.getMany(prod, query);

## API

**Available Functions**

- audits
  - getMany()
- convert
  - userUploadToExport()
  - userUploadDevicesToExport()
- deviceNames
  - getMany()
- devices
  - get()
  - getMany()
  - create()
  - update()
  - delete()
  - exportToImport()
  - fields()
  - sync()
- deviceTypes
  - getMany()
- dynamicTeams
  - get()
  - getMany()
  - getMembers()
  - create()
  - update()
  - delete()
  - exportToImport()
  - fields()
  - sync()
- environments
  - create()
- events
  - get()
  - getMany()
  - getManyUserDeliveries()
  - trigger()
  - create()
  - update()
- forms
  - get()
  - getMany()
  - getManyInPlan()
  - getResponseOptions()
  - getFormSections()
- groupMembers
  - getMany()
  - create()
  - delete()
- groups
  - get()
  - getMany()
  - getSupervisors()
  - create()
  - update()
  - delete()
  - exportToImport()
  - fields()
  - sync()
- importJobs
  - get()
  - getMany()
  - getMessages()
- integrations
  - get()
  - getMany()
  - getLogs()
  - create()
  - update()
  - delete()
- oauth
  - getToken()
  - refreshToken()
- onCall
  - getMany()
- people
  - get()
  - getMany()
  - getDevices()
  - getSupervisors()
  - getGroups()
  - create()
  - update()
  - delete()
  - exportToImport()
  - fields()
  - sync()
- planConstants
  - get()
  - getMany()
  - create()
  - update()
  - delete()
- planEndpoints
  - get()
  - getMany()
  - create()
  - update()
  - delete()
- planProperties
  - getMany()
  - create()
  - update()
- plans
  - get()
  - getMany()
  - create()
  - update()
  - delete()
- sharedLibraries
  - get()
  - getMany()
  - create()
  - update()
  - delete()
- shifts
  - get()
  - getMany()
  - getMembers()
  - create()
  - delete()
  - addMember()
  - exportToImport()
  - fields()
  - sync()
- sites
  - get()
  - getMany()
  - create()
  - update()
  - delete()
  - fields()
  - sync()
- subscriptionForms
  - get()
  - getMany()
  - getManyInPlan()
- subscriptions
  - get()
  - getMany()
  - getSubscribers()
  - create()
  - update()
  - delete()
  - deleteSubscriber()
  - fields()
- sync
  - xMattersToxMatters()
- temporaryAbsences
  - getMany()
  - create()
  - delete()
  - exportToImport()
  - fields()
  - sync()
- uploadUsers
  - usersCSV()
  - epicZipSync()
- util
  - omit()
  - get()
  - getMany()
  - create()
  - update()
  - upload()
  - request()
  - delete()
  - syncObject()

## Notes

- Create Plan doesn't support loggingLevel but update does. For synchronizations this means there will be an update the second time the sync is run to update the loggingLevel if the logging level is different in the source than the default.
- Creating and Updating xMatters Type endpoints in comm plans is not supported via API. They exist in every plan but require configuration in the UI to set the authenticating user.
- Syncing any communication plan related data such as the plans, forms, scenarios, plan properties, plan constants, plan endpoints, shared libraries, or integrations require that the rest user have edit access for the communication plan(s). One way to accomplish this is to add the Rest Web Services Role to each of the communication plans. The specific user can also be added rather than the entire role.
- Form apis do not exist to allow the updating and deleting comm plan forms and therefore they cannot be synced. Scenarios depend on forms. If scenarios are synchronized the forms must be created independently of the sync with the same properties in the form layout.
-
