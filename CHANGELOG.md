# Changelog

[npm history][1]

[1]: https://www.npmjs.com/package/nodejs-spanner?activeTab=versions

## v2.1.0

### Implementation Changes
- chore: use arrow functions ([#359](https://github.com/googleapis/nodejs-spanner/pull/359))
- fix: change exists to return false on error code 5 ([#353](https://github.com/googleapis/nodejs-spanner/pull/353))
- Switch to let/const ([#328](https://github.com/googleapis/nodejs-spanner/pull/328))
- Minor: wrap the inner error on retried transactions and return when deadline exceeded ([#309](https://github.com/googleapis/nodejs-spanner/pull/309))
- chore: convert index to es6 class ([#306](https://github.com/googleapis/nodejs-spanner/pull/306))
- Fix p-retry is accepting function not object/promise ([#312](https://github.com/googleapis/nodejs-spanner/pull/312))

### New Features
- feat: dml/pdml support ([#348](https://github.com/googleapis/nodejs-spanner/pull/348))
- feat(table): drop method and additional error handling to delete ([#358](https://github.com/googleapis/nodejs-spanner/pull/358))
- feat(PartialResultStream): emit raw responses as event ([#357](https://github.com/googleapis/nodejs-spanner/pull/357))
- feat(transaction): add backup backoff delay ([#350](https://github.com/googleapis/nodejs-spanner/pull/350))

### Dependencies
- chore(deps): update dependency eslint-plugin-prettier to v3 ([#351](https://github.com/googleapis/nodejs-spanner/pull/351))
- fix(deps): update dependency @google-cloud/common-grpc to ^0.9.0 ([#339](https://github.com/googleapis/nodejs-spanner/pull/339))
- fix(deps): update dependency google-gax to ^0.20.0 ([#327](https://github.com/googleapis/nodejs-spanner/pull/327))
- fix(deps): update dependency delay to v4 ([#322](https://github.com/googleapis/nodejs-spanner/pull/322))
- fix: upgrade to the latest common-grpc ([#320](https://github.com/googleapis/nodejs-spanner/pull/320))
- fix(deps): update dependency google-auth-library to v2 ([#319](https://github.com/googleapis/nodejs-spanner/pull/319))
- fix(deps): update dependency p-queue to v3 ([#317](https://github.com/googleapis/nodejs-spanner/pull/317))
- chore(deps): update dependency nyc to v13 ([#314](https://github.com/googleapis/nodejs-spanner/pull/314))

### Documentation
- docs: add typedefs for commit timestamp ([#356](https://github.com/googleapis/nodejs-spanner/pull/356))
- docs: various jsdoc fixes ([#352](https://github.com/googleapis/nodejs-spanner/pull/352))

### Internal / Testing Changes
- chore: update auto-generated config ([#362](https://github.com/googleapis/nodejs-spanner/pull/362))
- chore: change queries to return expected values ([#355](https://github.com/googleapis/nodejs-spanner/pull/355))
- Update CI config ([#354](https://github.com/googleapis/nodejs-spanner/pull/354))
- chore: make sure workloadb benchmark runs properly ([#349](https://github.com/googleapis/nodejs-spanner/pull/349))
- test: Add delay for system test. ([#16](https://github.com/googleapis/nodejs-spanner/pull/16))
- Update QuickStart to use "new" syntax for creating Spanner client. ([#344](https://github.com/googleapis/nodejs-spanner/pull/344))
- test: remove appveyor config ([#342](https://github.com/googleapis/nodejs-spanner/pull/342))
- Update CI config ([#341](https://github.com/googleapis/nodejs-spanner/pull/341))
- Fix the failing lint rules ([#338](https://github.com/googleapis/nodejs-spanner/pull/338))
- Enable prefer-const in the eslint config ([#337](https://github.com/googleapis/nodejs-spanner/pull/337))
- soften assertion in system tests ([#335](https://github.com/googleapis/nodejs-spanner/pull/335))
- Update protos and comments ([#334](https://github.com/googleapis/nodejs-spanner/pull/334))
- fix string comparison in system test ([#333](https://github.com/googleapis/nodejs-spanner/pull/333))
- Enable no-var in eslint ([#331](https://github.com/googleapis/nodejs-spanner/pull/331))
- Add synth templates ([#330](https://github.com/googleapis/nodejs-spanner/pull/330))
- test: throw on deprecation ([#279](https://github.com/googleapis/nodejs-spanner/pull/279))
- Retry npm install in CI ([#323](https://github.com/googleapis/nodejs-spanner/pull/323))
- Re-generate library using /synth.py ([#316](https://github.com/googleapis/nodejs-spanner/pull/316))
- Fix color highlighting in CHANGELOG.md ([#313](https://github.com/googleapis/nodejs-spanner/pull/313))
- Update sample dependency @google-cloud/spanner to v2 ([#310](https://github.com/googleapis/nodejs-spanner/pull/310))
- Re-generate library using /synth.py ([#308](https://github.com/googleapis/nodejs-spanner/pull/308))

## v2.0.0

### Breaking Changes
- Drop support for Node.js v4.x.x and v9.x.x (#226)

- Use es style imports (#302)
  The import syntax for this library has changed to be [es module](https://nodejs.org/api/esm.html) compliant.

  #### Old code
  ```js
  const spanner = require('@google-cloud/spanner')();
  // or
  const Spanner = require('@google-cloud/spanner');
  const spanner = new Spanner();
  ```

  #### New code
  ```js
  const {Spanner} = require('@google-cloud/spanner');
  const spanner = new Spanner();
  ```

### New Features
- add runTransactionAsync method (#294)
  ```js
  const {Spanner} = require('@google-cloud/spanner');
  const spanner = new Spanner();

  const instance = spanner.instance('my-instance');
  const database = instance.database('my-database');

  await database.runTransactionAsync(async (transaction) => {
      const [rows] = await transaction.run('SELECT * FROM MyTable');
      const data = rows.map(row => row.thing);
      await transaction.commit();
      return data;
  }).then(data => {
    // ...
  });
  ```
- feature(database): make session pool hot swappable (#243)

### Implementation Changes
- feat: use es style imports (#302)
- fix: perform type check on grpc value (#300)
- chore: use es classes in a few places (#297)
- chore: do not use npm ci (#292)
- chore: split the common module (#289)
- test: fix strict equal assertions (#287)
- chore: ignore package-lock.json (#286)
- chore: use let and const (#283)
- chore: update renovate config (#281)
- Re-generate library using /synth.py (#282)
- chore: use assert.deepStrictEqual instead of assert.deepEqual (#274)
- chore: require node 8 for samples (#273)
- test: use strictEqual in tests (#267)
- use node_library not not internal generate method (#247)
- Configure Renovate (#239)
- fix: drop support for node.js 4.x and 9.x (#226)

### Dependencies
- fix(deps): update dependency google-gax to ^0.19.0 (#298)
- chore(deps): update dependency eslint-config-prettier to v3 (#295)
- fix(deps): update dependency google-gax to ^0.18.0 (#278)
- chore(deps): update dependency eslint-plugin-node to v7 (#266)
- refactor: update auth library, common-grpc (#256)
- fix(deps): update dependency yargs to v12 (#254)
- chore(deps): update dependency yargs to v12 (#252)
- chore(deps): update dependency sinon to v6.0.1 (#250)
- chore(package): update eslint to version 5.0.0 (#240)
- chore: update sample lockfiles (#246)
- Update to support google-gax v0.17 (#244)
- fix(package): update @google-cloud/common-grpc to version 0.7.1 (#235)
- refactor: drop dependency on safe-buffer (#232)
- refactor: remove dependency generic-pool (#231)
- refactor: drop dependency on lodash.flatten (#233)
- refactor: remove array-uniq as dependency (#227)
- refactor: remove string-obj-format (#229)
- refactor: remove methmeth as a dependency (#228)
- chore: upgrade several dependencies (#221)

### Internal / Testing Changes
- chore: move mocha options to mocha.opts (#272)
- refactor: drop repo-tool as an exec wrapper (#248)
- fix: update linking for samples (#242)
- Adding Spanner STRUCT param samples (#219)
