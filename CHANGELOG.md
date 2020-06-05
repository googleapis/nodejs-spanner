# Changelog

[npm history][1]

[1]: https://www.npmjs.com/package/nodejs-spanner?activeTab=versions

## [5.1.0](https://www.github.com/googleapis/nodejs-spanner/compare/v5.0.0...v5.1.0) (2020-06-04)


### Features

* expose displayName in createInstance ([#798](https://www.github.com/googleapis/nodejs-spanner/issues/798)) ([39efda1](https://www.github.com/googleapis/nodejs-spanner/commit/39efda194d2d11a578f209e6c149b0ae2974ee27))
* increase sessions in the pool in batches ([#963](https://www.github.com/googleapis/nodejs-spanner/issues/963)) ([91c53cb](https://www.github.com/googleapis/nodejs-spanner/commit/91c53cb6f6504f48ee3c974dbb8fb2821c226325))
* support callbacks for exists(), getState(), getExpireTime() methods ([#1070](https://www.github.com/googleapis/nodejs-spanner/issues/1070)) ([7736080](https://www.github.com/googleapis/nodejs-spanner/commit/7736080f0e2a46c7ef8c44c278bff2bec2f28953))


### Bug Fixes

* always clean up stale instances if any ([#1030](https://www.github.com/googleapis/nodejs-spanner/issues/1030)) ([87c7edc](https://www.github.com/googleapis/nodejs-spanner/commit/87c7edcb2c3ba729b1e278bb191b695b0cd376cb))
* pause request stream on backpressure ([#936](https://www.github.com/googleapis/nodejs-spanner/issues/936)) ([558692f](https://www.github.com/googleapis/nodejs-spanner/commit/558692f55cc551db2bd72464b130051a9b28378f)), closes [#934](https://www.github.com/googleapis/nodejs-spanner/issues/934)

## [5.0.0](https://www.github.com/googleapis/nodejs-spanner/compare/v4.8.0...v5.0.0) (2020-05-14)


### ⚠ BREAKING CHANGES

* **types:** properly format listing methods with gaxOptions (#925)
* **types:** types for createInstance (#805)
* add typings for top level object (#781)
* **deps:** update dependency @google-cloud/common to v3 (#875)
* drop Node.js 8 support.

### Features

* add typings for top level object ([#781](https://www.github.com/googleapis/nodejs-spanner/issues/781)) ([c2b6f68](https://www.github.com/googleapis/nodejs-spanner/commit/c2b6f685c2f36866ddaa434c923be417de0f89ec))
* check status of long running operation by its name ([#937](https://www.github.com/googleapis/nodejs-spanner/issues/937)) ([5035e11](https://www.github.com/googleapis/nodejs-spanner/commit/5035e11f55a28def0d524a8e6ea7671367cd345e))
* run and runStream can return query stats ([#857](https://www.github.com/googleapis/nodejs-spanner/issues/857)) ([1656e4f](https://www.github.com/googleapis/nodejs-spanner/commit/1656e4f14f0dd24f530f36ecf1ccf34b51e726fb))
* spanner backup and restore support ([#855](https://www.github.com/googleapis/nodejs-spanner/issues/855)) ([967903c](https://www.github.com/googleapis/nodejs-spanner/commit/967903c4152e283f5a09dbd1b8ab3c9bc66728d3))


### Bug Fixes

* **deps:** update dependency @google-cloud/common to v3 ([#875](https://www.github.com/googleapis/nodejs-spanner/issues/875)) ([f3da343](https://www.github.com/googleapis/nodejs-spanner/commit/f3da3430645ae277ae40410b6494ea8477937610))
* **deps:** update dependency @google-cloud/paginator to v3 ([#871](https://www.github.com/googleapis/nodejs-spanner/issues/871)) ([d3b2f2c](https://www.github.com/googleapis/nodejs-spanner/commit/d3b2f2c48a21e41700877677bb2041b368773e36))
* **deps:** update dependency @google-cloud/precise-date to v2 ([#873](https://www.github.com/googleapis/nodejs-spanner/issues/873)) ([8e8b29c](https://www.github.com/googleapis/nodejs-spanner/commit/8e8b29c389d68d0f872726655c9022d899a3ea3c))
* **deps:** update dependency @google-cloud/projectify to v2 ([#870](https://www.github.com/googleapis/nodejs-spanner/issues/870)) ([e77460b](https://www.github.com/googleapis/nodejs-spanner/commit/e77460b6cc005049833f206f3fa74fc722ee3536))
* **deps:** update dependency @google-cloud/promisify to v2 ([#868](https://www.github.com/googleapis/nodejs-spanner/issues/868)) ([afe4b15](https://www.github.com/googleapis/nodejs-spanner/commit/afe4b1518aadee91fb339512470e550295f89c4d))
* **types:** fix type of ReadRequest ([#876](https://www.github.com/googleapis/nodejs-spanner/issues/876)) ([990fec2](https://www.github.com/googleapis/nodejs-spanner/commit/990fec20c482e11f48b8b7fbaacae8f395e93db9))
* **types:** properly format listing methods with gaxOptions ([#925](https://www.github.com/googleapis/nodejs-spanner/issues/925)) ([23958ae](https://www.github.com/googleapis/nodejs-spanner/commit/23958ae48f49306cf38755831db091fef16998fb))
* delete old instances then create new instance ([#955](https://www.github.com/googleapis/nodejs-spanner/issues/955)) ([96813f8](https://www.github.com/googleapis/nodejs-spanner/commit/96813f81913322f6c9a84aa9c7757029ce5f48eb))
* remove eslint, update gax, fix generated protos, run the generator ([#897](https://www.github.com/googleapis/nodejs-spanner/issues/897)) ([7cfba21](https://www.github.com/googleapis/nodejs-spanner/commit/7cfba215b436e997919a9816bd076c62cce90bbf))
* remove src/common-grpc/operation.ts ([#879](https://www.github.com/googleapis/nodejs-spanner/issues/879)) ([a30d2b4](https://www.github.com/googleapis/nodejs-spanner/commit/a30d2b47b2ccbbdf0d473281a4f76584c4850659)), closes [#878](https://www.github.com/googleapis/nodejs-spanner/issues/878)
* remove typescript conversion leftovers ([#901](https://www.github.com/googleapis/nodejs-spanner/issues/901)) ([ccf1b61](https://www.github.com/googleapis/nodejs-spanner/commit/ccf1b61bcf060a72c35712c5d0e529fad9684724))
* skip some tests when run against the emulator ([#933](https://www.github.com/googleapis/nodejs-spanner/issues/933)) ([2d91757](https://www.github.com/googleapis/nodejs-spanner/commit/2d917575dade110cbb3418d5d48c6fd0e77fae63))
* update spanner package in sample ([#930](https://www.github.com/googleapis/nodejs-spanner/issues/930)) ([5624b7b](https://www.github.com/googleapis/nodejs-spanner/commit/5624b7bafb585adcbd0a7c9d53f728ff77afb1fa))
* use DELETE FROM for consistency ([#923](https://www.github.com/googleapis/nodejs-spanner/issues/923)) ([0854c70](https://www.github.com/googleapis/nodejs-spanner/commit/0854c70d810ea05e5077d4c1a801040347415cfd))
* **types:** types for createInstance ([#805](https://www.github.com/googleapis/nodejs-spanner/issues/805)) ([67b0f54](https://www.github.com/googleapis/nodejs-spanner/commit/67b0f54c65b51ff9cec313f67c4ea54dab7c8123))


### Build System

* drop node8 and convert to TypeScript ([#888](https://www.github.com/googleapis/nodejs-spanner/issues/888)) ([4116f81](https://www.github.com/googleapis/nodejs-spanner/commit/4116f81ec9715fde14b48e0daa6930bb8c502dbe))

## [4.8.0](https://www.github.com/googleapis/nodejs-spanner/compare/v4.7.0...v4.8.0) (2020-03-12)


### Features

* add backups API ([#851](https://www.github.com/googleapis/nodejs-spanner/issues/851)) ([faf224d](https://www.github.com/googleapis/nodejs-spanner/commit/faf224dc4010337829eb0b6ecd7df274f1de5fff))
* add support for QueryOptions ([#846](https://www.github.com/googleapis/nodejs-spanner/issues/846)) ([c1098c5](https://www.github.com/googleapis/nodejs-spanner/commit/c1098c5f4509918cacd3942b8f09354c88a85bb9))

## [4.7.0](https://www.github.com/googleapis/nodejs-spanner/compare/v4.6.2...v4.7.0) (2020-02-27)


### Features

* export protos in src/index.ts ([0fa0f93](https://www.github.com/googleapis/nodejs-spanner/commit/0fa0f933ac9655278a4684bfa9e07cc912442fbf))

### [4.6.2](https://www.github.com/googleapis/nodejs-spanner/compare/v4.6.1...v4.6.2) (2020-02-14)


### Bug Fixes

* Correctly parse metadata from BatchDML response + fix flaky system test ([#825](https://www.github.com/googleapis/nodejs-spanner/issues/825)) ([8b95da7](https://www.github.com/googleapis/nodejs-spanner/commit/8b95da7c68694d7a4ce5644e82d8485d01efb434))
* retry 'Session not found' errors on getSnapshot ([#819](https://www.github.com/googleapis/nodejs-spanner/issues/819)) ([59bafbf](https://www.github.com/googleapis/nodejs-spanner/commit/59bafbfbcfe1fc3c45291a6fab6a343299123905))
* retry 'Session not found' for r/w tx ([#824](https://www.github.com/googleapis/nodejs-spanner/issues/824)) ([1b393c4](https://www.github.com/googleapis/nodejs-spanner/commit/1b393c4c940d196232f8fc6ac99dbb5d1fd61e4d))

### [4.6.1](https://www.github.com/googleapis/nodejs-spanner/compare/v4.6.0...v4.6.1) (2020-01-29)


### Bug Fixes

* enum, bytes, and Long types now accept strings ([#816](https://www.github.com/googleapis/nodejs-spanner/issues/816)) ([e63914d](https://www.github.com/googleapis/nodejs-spanner/commit/e63914d19813400daa2b08abfba43e1d87abfe7b))
* fixed wrong return type of Database.run(..) ([#810](https://www.github.com/googleapis/nodejs-spanner/issues/810)) ([10c31d8](https://www.github.com/googleapis/nodejs-spanner/commit/10c31d80fdde2b91f2498ffcbc90a20a83c1a454)), closes [#809](https://www.github.com/googleapis/nodejs-spanner/issues/809)
* retry Session not found for Database.run(..) ([#812](https://www.github.com/googleapis/nodejs-spanner/issues/812)) ([6a48fd6](https://www.github.com/googleapis/nodejs-spanner/commit/6a48fd61bc6f424865e5a265bc1d7bac81454a7d))
* use PreciseDate instead of Date for min read timestamp ([#807](https://www.github.com/googleapis/nodejs-spanner/issues/807)) ([da8c2f8](https://www.github.com/googleapis/nodejs-spanner/commit/da8c2f85b55346d99a9eacc4249e6d6cd1a14556))

## [4.6.0](https://www.github.com/googleapis/nodejs-spanner/compare/v4.5.2...v4.6.0) (2020-01-16)


### Features

* add fieldNames option in instance#getMetadata() ([#760](https://www.github.com/googleapis/nodejs-spanner/issues/760)) ([fa3154e](https://www.github.com/googleapis/nodejs-spanner/commit/fa3154ebe6754ecce1dd7b32442bda0eb27842f6))

### [4.5.2](https://www.github.com/googleapis/nodejs-spanner/compare/v4.5.1...v4.5.2) (2020-01-15)


### Bug Fixes

* max backoff should be 32 seconds ([#792](https://www.github.com/googleapis/nodejs-spanner/issues/792)) ([c697240](https://www.github.com/googleapis/nodejs-spanner/commit/c697240c0f1c5d55bee63732b7346e7c95f25dcc))
* retry executeStreamingSql when error code is retryable ([#795](https://www.github.com/googleapis/nodejs-spanner/issues/795)) ([1491858](https://www.github.com/googleapis/nodejs-spanner/commit/149185809fe32e05504d398849f7eadfe864fb6b)), closes [#620](https://www.github.com/googleapis/nodejs-spanner/issues/620)

### [4.5.1](https://www.github.com/googleapis/nodejs-spanner/compare/v4.5.0...v4.5.1) (2020-01-08)


### Bug Fixes

* session pool should only create session if pending<=waiters ([#791](https://www.github.com/googleapis/nodejs-spanner/issues/791)) ([75345b1](https://www.github.com/googleapis/nodejs-spanner/commit/75345b18d37937b60a89c6b039c6b3a39b0ea6b7)), closes [#790](https://www.github.com/googleapis/nodejs-spanner/issues/790)

## [4.5.0](https://www.github.com/googleapis/nodejs-spanner/compare/v4.4.1...v4.5.0) (2020-01-06)


### Features

* include potential leaked session stacktraces in error ([#759](https://www.github.com/googleapis/nodejs-spanner/issues/759)) ([1c0cf27](https://www.github.com/googleapis/nodejs-spanner/commit/1c0cf27b6c502fe7cc03f9b4c9191d746761b8b6))


### Bug Fixes

* clear stack of session while preparing new r/w tx ([#768](https://www.github.com/googleapis/nodejs-spanner/issues/768)) ([c852709](https://www.github.com/googleapis/nodejs-spanner/commit/c852709cf509d174ff140ad946fbbc20e5594aba))
* delete env var after test if it was not set ([#774](https://www.github.com/googleapis/nodejs-spanner/issues/774)) ([7a1f40d](https://www.github.com/googleapis/nodejs-spanner/commit/7a1f40d5041e217363722d5a8b45c181f7a1510a))
* end readWrite transaction in sample ([#766](https://www.github.com/googleapis/nodejs-spanner/issues/766)) ([f419e27](https://www.github.com/googleapis/nodejs-spanner/commit/f419e27e24eb8df78633d8245c364a709e58d007))
* return different databases for different pool options ([#754](https://www.github.com/googleapis/nodejs-spanner/issues/754)) ([106c7a5](https://www.github.com/googleapis/nodejs-spanner/commit/106c7a513052631cf08f1db23ed099d2e3178635))
* session pool should use push/pop and return sessions lifo ([#776](https://www.github.com/googleapis/nodejs-spanner/issues/776)) ([384bde1](https://www.github.com/googleapis/nodejs-spanner/commit/384bde1848f2fc72f52601f5b57af17dadebca69))
* transaction runner should not timeout before first attempt ([#789](https://www.github.com/googleapis/nodejs-spanner/issues/789)) ([c75076e](https://www.github.com/googleapis/nodejs-spanner/commit/c75076e01b8480386289c237bc01d0ea2b42c85c)), closes [#786](https://www.github.com/googleapis/nodejs-spanner/issues/786)
* year zero was not accepted for SpannerDate ([#783](https://www.github.com/googleapis/nodejs-spanner/issues/783)) ([0ceb862](https://www.github.com/googleapis/nodejs-spanner/commit/0ceb862beac57f3732e0097d808b62dbdfa5d3a9))

### [4.4.1](https://www.github.com/googleapis/nodejs-spanner/compare/v4.4.0...v4.4.1) (2019-12-16)


### Bug Fixes

* get stacktrace before any async method call ([#756](https://www.github.com/googleapis/nodejs-spanner/issues/756)) ([3091a78](https://www.github.com/googleapis/nodejs-spanner/commit/3091a7849985330828703018b43f6cfabc0e381a))

## [4.4.0](https://www.github.com/googleapis/nodejs-spanner/compare/v4.3.0...v4.4.0) (2019-12-10)


### Features

* add plural and singular resource descriptor ([#737](https://www.github.com/googleapis/nodejs-spanner/issues/737)) ([11658bf](https://www.github.com/googleapis/nodejs-spanner/commit/11658bfae8467e6788bb492895e7afb9202c59f4))
* add replica support ([#726](https://www.github.com/googleapis/nodejs-spanner/issues/726)) ([dea3e59](https://www.github.com/googleapis/nodejs-spanner/commit/dea3e599759f374773ed5e4180187e79f518a7b6))


### Bug Fixes

* changes to default rpc timeouts ([da066fc](https://www.github.com/googleapis/nodejs-spanner/commit/da066fc916df4468c5f7d0538aadc5677c5bdb33))
* **deps:** pin TypeScript below 3.7.0 ([7b1e07b](https://www.github.com/googleapis/nodejs-spanner/commit/7b1e07b33f31f93adf125a19db03fa6d5baf0b6b))
* **deps:** update dependency yargs to v15 ([#736](https://www.github.com/googleapis/nodejs-spanner/issues/736)) ([e289890](https://www.github.com/googleapis/nodejs-spanner/commit/e2898907511a3426c6c42204c80765716a3317a6))
* **docs:** snippets are now replaced in jsdoc comments ([#731](https://www.github.com/googleapis/nodejs-spanner/issues/731)) ([843ce6f](https://www.github.com/googleapis/nodejs-spanner/commit/843ce6f1cf14f14ab05c9983f6f5b7a8428fa6c7))
* createInstance should return a value ([#747](https://www.github.com/googleapis/nodejs-spanner/issues/747)) ([16c013f](https://www.github.com/googleapis/nodejs-spanner/commit/16c013f04a02cbc07222f1d571ff0b016646c672))
* include long import in proto typescript declaration file ([#732](https://www.github.com/googleapis/nodejs-spanner/issues/732)) ([6fe0757](https://www.github.com/googleapis/nodejs-spanner/commit/6fe0757d659e7c0835fc8c40b4617c688ce69551))
* restore SessionLeakError name after super call ([#745](https://www.github.com/googleapis/nodejs-spanner/issues/745)) ([d04609b](https://www.github.com/googleapis/nodejs-spanner/commit/d04609b40023b411c08052f503baa54610062994))

## [4.3.0](https://www.github.com/googleapis/nodejs-spanner/compare/v4.2.0...v4.3.0) (2019-11-05)


### Features

* **database:** batch create sessions ([#692](https://www.github.com/googleapis/nodejs-spanner/issues/692)) ([21f83b1](https://www.github.com/googleapis/nodejs-spanner/commit/21f83b1b13e12fb413138267dd4dc1bdaa24ccb9))


### Bug Fixes

* **deps:** bump google-gax to 1.7.5 ([#712](https://www.github.com/googleapis/nodejs-spanner/issues/712)) ([03384d4](https://www.github.com/googleapis/nodejs-spanner/commit/03384d4b93a66c758f1db75fa5efa1572f5c1eaf))
* don't wrap SpannerDate so timezone does not affect results ([#711](https://www.github.com/googleapis/nodejs-spanner/issues/711)) ([86c0ae5](https://www.github.com/googleapis/nodejs-spanner/commit/86c0ae5fbdddccd915689bbfff3af8834ec64d12))

## [4.2.0](https://www.github.com/googleapis/nodejs-spanner/compare/v4.1.0...v4.2.0) (2019-10-02)


### Bug Fixes

* adjust timeout values ([#700](https://www.github.com/googleapis/nodejs-spanner/issues/700)) ([4571f15](https://www.github.com/googleapis/nodejs-spanner/commit/4571f15))
* use compatible version of google-gax ([d312a8f](https://www.github.com/googleapis/nodejs-spanner/commit/d312a8f))


### Features

* .d.ts for protos ([4d3d649](https://www.github.com/googleapis/nodejs-spanner/commit/4d3d649))

## [4.1.0](https://www.github.com/googleapis/nodejs-spanner/compare/v4.0.2...v4.1.0) (2019-09-16)


### Bug Fixes

* **deps:** update dependency yargs to v14 ([#680](https://www.github.com/googleapis/nodejs-spanner/issues/680)) ([add2f05](https://www.github.com/googleapis/nodejs-spanner/commit/add2f05))
* **types:** import request types from teeny-request ([#682](https://www.github.com/googleapis/nodejs-spanner/issues/682)) ([a1ecd80](https://www.github.com/googleapis/nodejs-spanner/commit/a1ecd80))
* set proper version # for x-goog-api-client ([#681](https://www.github.com/googleapis/nodejs-spanner/issues/681)) ([f300fad](https://www.github.com/googleapis/nodejs-spanner/commit/f300fad))


### Features

* load protos from JSON, grpc-fallback support ([0b3fb90](https://www.github.com/googleapis/nodejs-spanner/commit/0b3fb90))
* support batch create sessions ([#685](https://www.github.com/googleapis/nodejs-spanner/issues/685)) ([7bc58cf](https://www.github.com/googleapis/nodejs-spanner/commit/7bc58cf))
* use JSON proto for transaction-runner ([#690](https://www.github.com/googleapis/nodejs-spanner/issues/690)) ([279fc97](https://www.github.com/googleapis/nodejs-spanner/commit/279fc97))

### [4.0.2](https://www.github.com/googleapis/nodejs-spanner/compare/v4.0.1...v4.0.2) (2019-08-09)


### Bug Fixes

* allow calls with no request, add JSON proto ([4a478a7](https://www.github.com/googleapis/nodejs-spanner/commit/4a478a7))
* **deps:** use the latest extend ([#678](https://www.github.com/googleapis/nodejs-spanner/issues/678)) ([a094fdd](https://www.github.com/googleapis/nodejs-spanner/commit/a094fdd))

### [4.0.1](https://www.github.com/googleapis/nodejs-spanner/compare/v4.0.0...v4.0.1) (2019-07-29)


### Bug Fixes

* **deps:** update dependency @google-cloud/paginator to v2 ([#668](https://www.github.com/googleapis/nodejs-spanner/issues/668)) ([86d3638](https://www.github.com/googleapis/nodejs-spanner/commit/86d3638))
* **deps:** update dependency google-auth-library to v5 ([#669](https://www.github.com/googleapis/nodejs-spanner/issues/669)) ([c6d165e](https://www.github.com/googleapis/nodejs-spanner/commit/c6d165e))
* **docs:** move docs under overloads to be picked up by JSDoc ([#666](https://www.github.com/googleapis/nodejs-spanner/issues/666)) ([be10eb1](https://www.github.com/googleapis/nodejs-spanner/commit/be10eb1))

## [4.0.0](https://www.github.com/googleapis/nodejs-spanner/compare/v3.1.0...v4.0.0) (2019-07-19)


### ⚠ BREAKING CHANGES

* **deps:** this will ship async/await in the generated code
* upgrade engines field to >=8.10.0 (#587)

### Bug Fixes

* **deps:** update dependency @google-cloud/common-grpc to v1 ([#607](https://www.github.com/googleapis/nodejs-spanner/issues/607)) ([084dc8c](https://www.github.com/googleapis/nodejs-spanner/commit/084dc8c))
* **deps:** update dependency @google-cloud/paginator to ^0.2.0 ([#560](https://www.github.com/googleapis/nodejs-spanner/issues/560)) ([8fe33a1](https://www.github.com/googleapis/nodejs-spanner/commit/8fe33a1))
* **deps:** update dependency @google-cloud/paginator to v1 ([#593](https://www.github.com/googleapis/nodejs-spanner/issues/593)) ([bfb2255](https://www.github.com/googleapis/nodejs-spanner/commit/bfb2255))
* **deps:** update dependency @google-cloud/precise-date to v1 ([#600](https://www.github.com/googleapis/nodejs-spanner/issues/600)) ([f52494f](https://www.github.com/googleapis/nodejs-spanner/commit/f52494f))
* **deps:** update dependency @google-cloud/projectify to v1 ([#591](https://www.github.com/googleapis/nodejs-spanner/issues/591)) ([22713c1](https://www.github.com/googleapis/nodejs-spanner/commit/22713c1))
* **deps:** update dependency @google-cloud/promisify to v1 ([#592](https://www.github.com/googleapis/nodejs-spanner/issues/592)) ([cb76922](https://www.github.com/googleapis/nodejs-spanner/commit/cb76922))
* **deps:** update dependency arrify to v2 ([#577](https://www.github.com/googleapis/nodejs-spanner/issues/577)) ([6e0ddc8](https://www.github.com/googleapis/nodejs-spanner/commit/6e0ddc8))
* **deps:** update dependency google-auth-library to v4 ([#599](https://www.github.com/googleapis/nodejs-spanner/issues/599)) ([21b9995](https://www.github.com/googleapis/nodejs-spanner/commit/21b9995))
* **deps:** update dependency google-gax to ^0.26.0 ([#586](https://www.github.com/googleapis/nodejs-spanner/issues/586)) ([0f88be2](https://www.github.com/googleapis/nodejs-spanner/commit/0f88be2))
* **deps:** update dependency merge-stream to v2 ([#624](https://www.github.com/googleapis/nodejs-spanner/issues/624)) ([3aa676d](https://www.github.com/googleapis/nodejs-spanner/commit/3aa676d))
* **deps:** update dependency p-queue to v4 ([#558](https://www.github.com/googleapis/nodejs-spanner/issues/558)) ([7547e21](https://www.github.com/googleapis/nodejs-spanner/commit/7547e21))
* **deps:** update dependency p-queue to v5 ([#578](https://www.github.com/googleapis/nodejs-spanner/issues/578)) ([7827fb4](https://www.github.com/googleapis/nodejs-spanner/commit/7827fb4))
* **deps:** update dependency p-queue to v6.0.2 ([#643](https://www.github.com/googleapis/nodejs-spanner/issues/643)) ([ace1359](https://www.github.com/googleapis/nodejs-spanner/commit/ace1359))
* **deps:** upgrade to google-gax 1.x ([#651](https://www.github.com/googleapis/nodejs-spanner/issues/651)) ([a32e838](https://www.github.com/googleapis/nodejs-spanner/commit/a32e838))
* **docs:** add google.type namespace ([#605](https://www.github.com/googleapis/nodejs-spanner/issues/605)) ([5cc6dc1](https://www.github.com/googleapis/nodejs-spanner/commit/5cc6dc1))
* **docs:** link to reference docs section on googleapis.dev ([#654](https://www.github.com/googleapis/nodejs-spanner/issues/654)) ([2379dc2](https://www.github.com/googleapis/nodejs-spanner/commit/2379dc2))
* **docs:** move to new client docs URL ([#647](https://www.github.com/googleapis/nodejs-spanner/issues/647)) ([7dec1bd](https://www.github.com/googleapis/nodejs-spanner/commit/7dec1bd))
* **transaction:** set/update seqno for all sql requests ([#661](https://www.github.com/googleapis/nodejs-spanner/issues/661)) ([102cae1](https://www.github.com/googleapis/nodejs-spanner/commit/102cae1))
* DEADLINE_EXCEEDED is no longer retried ([#598](https://www.github.com/googleapis/nodejs-spanner/issues/598)) ([1cac4fc](https://www.github.com/googleapis/nodejs-spanner/commit/1cac4fc))
* include 'x-goog-request-params' header in requests ([#573](https://www.github.com/googleapis/nodejs-spanner/issues/573)) ([e0cb9dc](https://www.github.com/googleapis/nodejs-spanner/commit/e0cb9dc))
* treat deadline errors as idempotent ([#602](https://www.github.com/googleapis/nodejs-spanner/issues/602)) ([b3d494a](https://www.github.com/googleapis/nodejs-spanner/commit/b3d494a))
* update retry config ([#650](https://www.github.com/googleapis/nodejs-spanner/issues/650)) ([f1e8104](https://www.github.com/googleapis/nodejs-spanner/commit/f1e8104))


### Build System

* upgrade engines field to >=8.10.0 ([#587](https://www.github.com/googleapis/nodejs-spanner/issues/587)) ([970d335](https://www.github.com/googleapis/nodejs-spanner/commit/970d335))


### Features

* add .repo-metadata.json and move to new README template ([#636](https://www.github.com/googleapis/nodejs-spanner/issues/636)) ([11007cf](https://www.github.com/googleapis/nodejs-spanner/commit/11007cf))
* support apiEndpoint override ([#634](https://www.github.com/googleapis/nodejs-spanner/issues/634)) ([6a5eb36](https://www.github.com/googleapis/nodejs-spanner/commit/6a5eb36))
* support apiEndpoint override in client constructor ([#639](https://www.github.com/googleapis/nodejs-spanner/issues/639)) ([f6ebb27](https://www.github.com/googleapis/nodejs-spanner/commit/f6ebb27))


### Miscellaneous Chores

* **deps:** update dependency gts to v1 ([#584](https://www.github.com/googleapis/nodejs-spanner/issues/584)) ([135ac6d](https://www.github.com/googleapis/nodejs-spanner/commit/135ac6d))

## v3.1.0

03-06-2019 20:13 PST

### New Features
- feat(transaction): batch dml ([#550](https://github.com/googleapis/nodejs-spanner/pull/550))

### Dependencies
- chore(deps): update dependency @types/sinon to v7.0.9 ([#553](https://github.com/googleapis/nodejs-spanner/pull/553))
- chore(deps): fix broken dep types ([#549](https://github.com/googleapis/nodejs-spanner/pull/549))

### Documentation
- docs: Update grammar ([#544](https://github.com/googleapis/nodejs-spanner/pull/544))

### Internal / Testing Changes
- chore: update proto docs and code style
- chore(deps): use bundled p-queue types ([#547](https://github.com/googleapis/nodejs-spanner/pull/547))
- build: update release configuration ([#545](https://github.com/googleapis/nodejs-spanner/pull/545))
- build: use node10 to run samples-test, system-test etc ([#551](https://github.com/googleapis/nodejs-spanner/pull/551))

## v3.0.0

02-25-2019 12:38 PST

### Breaking Changes
- breaking: refactor(transaction): split logic into new classes ([#506](https://github.com/googleapis/nodejs-spanner/pull/506))
- breaking: feat(timestamp): create new date/timestamp classes ([#517](https://github.com/googleapis/nodejs-spanner/pull/517))
- fix: run generator to bring in streaming retry configs ([#448](https://github.com/googleapis/nodejs-spanner/pull/448))

#### Read-only Transactions (Snapshots) are no longer runnable via `Database#runTransaction` ([#506](https://github.com/googleapis/nodejs-spanner/pull/506))

`Database#runTransaction` is useful if want to replay a Transaction in its entirety in case you run into an `ABORTED` error. This should never happen with Snapshots, so it felt like it was time to create a new method just for them. *This change also means that `runTransaction` will only ever return read-write transactions.*

Before

```js
const bounds = {
  readOnly: true,
  strong: true,
};

database.runTransaction(bounds, (err, transaction) => {
  // ...
});
```

After

```js
const bounds = {
  strong: true,
};

database.getSnapshot(bounds, (err, snapshot) => {
  // ...
});
```

#### Timestamp bounds now offer nanosecond precision ([#506](https://github.com/googleapis/nodejs-spanner/pull/506))

This change allows you to specify a Snapshot read timestamp with more precision. Previously one could only specify in seconds, but now we support both milliseconds and nanoseconds.

Before

```js
const bounds = {
  exactStaleness: 5
};

const bounds = {
  readTimestamp: Date.now()
};
```

After

```js
const bounds = {
  // millisecond precision for staleness
  exactStaleness: 5000,

  // or if you need nano/micro precision for staleness
  exactStaleness: {seconds: 5, nanos: 321} // => 5000000321 nanoseconds
};

const bounds = {
  readTimestamp: Spanner.timestamp('2019-01-12T00:30:35.381101032Z')
};
```

#### Transaction#end changes. ([#506](https://github.com/googleapis/nodejs-spanner/pull/506))

Transactions saw a sizeable refactor with this version, previously `end()` performed a number of asynchronous tasks when called, however this is no longer true. Because of this, there isn't much of a need to track when end is finished, so we've dropped the callback parameter.

Additionally, `end()` will now be called automatically for failed calls to `Transaction#commit()` and `Transaction#rollback()`. If your code calls end after a failed commit/rollback, it will simply no-op.

Before

```js
transaction.end(callback);
```

After

```js
transaction.end();
callback();
```

#### Session#beginTransaction was removed ([#506](https://github.com/googleapis/nodejs-spanner/pull/506))

Spanner supports 4 different types of Transactions:

* ReadWrite
* ReadOnly
* PartitionedDml
* Batch

Using one method for all types became cumbersome when trying to manage the various options available to each, now each type has its own method.

Before

```js
const transaction = await session.beginTransaction({readWrite: true});
const snapshot = await session.beginTransaction({readOnly: true});
```

After

```js
const transaction = session.transaction();
await transaction.begin();

const snapshot = session.snapshot({strong: true});
await snapshot.begin();
```

#### Timestamps now represented by [`@google-cloud/precise-time`](https://github.com/googleapis/nodejs-precise-date) ([#517](https://github.com/googleapis/nodejs-spanner/pull/517))

While Spanner supports timestamps with nanosecond precision, JavaScript Dates do not. So we created the `PreciseDate` object which extends the native Date and adds both microsecond and nanosecond support.

Before

```js
const timestamp = Spanner.timestamp('2019-01-12T00:30:35.381101032Z');
// => {value: '2019-01-12T00:30:35.381Z'}
```

After

```js
// PreciseDate object
const timestamp = Spanner.timestamp('2019-01-12T00:30:35.381101032Z');
timestamp.toJSON(); // => '2019-01-12T00:30:35.381101032Z'
timestamp.toFullTimeString(); // => '1547253035381101032' (nanoseconds)
```

#### SpannerDate now extends the native Date object. ([#517](https://github.com/googleapis/nodejs-spanner/pull/517))

Since Timestamps saw an update, it made sense to give Spanner Date objects a similar update. The `Spanner.date()` method now returns a native Date object.

Before

```js
const date = Spanner.date('3-22-2018');
// => {value: '2018-3-22'}
```

After

```js
// Date object
const date = Spanner.date('3-22-2018');
date.toJSON(); // => '2018-3-22'
```

### New Features
- refactor(types): enable noImplicitAny in session-pool.ts ([#508](https://github.com/googleapis/nodejs-spanner/pull/508))
- refactor(table): improve typescript defs ([#495](https://github.com/googleapis/nodejs-spanner/pull/495))
- refactor(ts): partial-result-stream types/refactor ([#488](https://github.com/googleapis/nodejs-spanner/pull/488))
- refactor(codec): improve typescript defs ([#490](https://github.com/googleapis/nodejs-spanner/pull/490))
- chore(SessionPool): improve typescript types ([#479](https://github.com/googleapis/nodejs-spanner/pull/479))
- chore(typescript): add types for spanner gapic ([#487](https://github.com/googleapis/nodejs-spanner/pull/487))
- refactor(ts): enable noImplicitAny on src/session.ts ([#457](https://github.com/googleapis/nodejs-spanner/pull/457))

### Bug Fixes
- fix: throw on invalid credentials ([#522](https://github.com/googleapis/nodejs-spanner/pull/522))
- fix(transaction): re-use session in transaction runners ([#540](https://github.com/googleapis/nodejs-spanner/pull/540))

### Dependencies
- chore(deps): update dependency mocha to v6 ([#532](https://github.com/googleapis/nodejs-spanner/pull/532))
- fix(deps): update dependency @google-cloud/promisify to ^0.4.0 ([#524](https://github.com/googleapis/nodejs-spanner/pull/524))
- chore(deps): update dependency @types/p-retry to v3 ([#521](https://github.com/googleapis/nodejs-spanner/pull/521))
- fix(deps): update dependency yargs to v13 ([#520](https://github.com/googleapis/nodejs-spanner/pull/520))
- fix(deps): update dependency @google-cloud/common-grpc to ^0.10.0 ([#504](https://github.com/googleapis/nodejs-spanner/pull/504))
- fix(deps): update dependency google-gax to ^0.25.0 ([#505](https://github.com/googleapis/nodejs-spanner/pull/505))
- chore(deps): update dependency eslint-config-prettier to v4 ([#502](https://github.com/googleapis/nodejs-spanner/pull/502))
- fix(deps): update dependency google-gax to ^0.24.0 ([#501](https://github.com/googleapis/nodejs-spanner/pull/501))
- fix(deps): update dependency google-auth-library to v3 ([#498](https://github.com/googleapis/nodejs-spanner/pull/498))
- fix(deps): update dependency google-gax to ^0.23.0 ([#496](https://github.com/googleapis/nodejs-spanner/pull/496))
- chore(deps): update dependency concat-stream to v2 ([#489](https://github.com/googleapis/nodejs-spanner/pull/489))
- refactor: removed async from dependency list ([#449](https://github.com/googleapis/nodejs-spanner/pull/449))
- chore(deps): update dependency @types/sinon to v7 ([#480](https://github.com/googleapis/nodejs-spanner/pull/480))
- fix(deps): update dependency p-retry to v3 ([#481](https://github.com/googleapis/nodejs-spanner/pull/481))
- chore(deps): update dependency typescript to ~3.2.0 ([#459](https://github.com/googleapis/nodejs-spanner/pull/459))

### Documentation
- docs: fixed example for table.upsert() ([#533](https://github.com/googleapis/nodejs-spanner/pull/533))
- docs: update links in contrib guide ([#525](https://github.com/googleapis/nodejs-spanner/pull/525))
- docs: update contributing path in README ([#515](https://github.com/googleapis/nodejs-spanner/pull/515))
- docs: add lint/fix example to contributing guide ([#512](https://github.com/googleapis/nodejs-spanner/pull/512))
- docs: fix example comments ([#511](https://github.com/googleapis/nodejs-spanner/pull/511))
- chore: update proto licenses
- build: check broken links in generated docs ([#491](https://github.com/googleapis/nodejs-spanner/pull/491))
- fix(docs): remove unused long running operations and IAM types
- refactor: modernize sample tests ([#484](https://github.com/googleapis/nodejs-spanner/pull/484))
- docs: fix links in docstrings ([#467](https://github.com/googleapis/nodejs-spanner/pull/467))
- docs: fix typo ([#465](https://github.com/googleapis/nodejs-spanner/pull/465))
- chore: update license file ([#464](https://github.com/googleapis/nodejs-spanner/pull/464))
- docs: update readme badges ([#462](https://github.com/googleapis/nodejs-spanner/pull/462))
- docs(samples): Add sample to delete using a mutation. ([#458](https://github.com/googleapis/nodejs-spanner/pull/458))

### Internal / Testing Changes
- chore: add spanner_grpc_config.json and enable grpc-gcp support for spanner ([#503](https://github.com/googleapis/nodejs-spanner/pull/503))
- build: use linkinator for docs test ([#523](https://github.com/googleapis/nodejs-spanner/pull/523))
- build: create docs test npm scripts ([#519](https://github.com/googleapis/nodejs-spanner/pull/519))
- build: test using @grpc/grpc-js in CI ([#516](https://github.com/googleapis/nodejs-spanner/pull/516))
- chore: move CONTRIBUTING.md to root ([#514](https://github.com/googleapis/nodejs-spanner/pull/514))
- refactor: improve generated code style. ([#510](https://github.com/googleapis/nodejs-spanner/pull/510))
- build: ignore googleapis.com in doc link check ([#500](https://github.com/googleapis/nodejs-spanner/pull/500))
- fix: fix the sample tests ([#486](https://github.com/googleapis/nodejs-spanner/pull/486))
- chore(build): inject yoshi automation key ([#478](https://github.com/googleapis/nodejs-spanner/pull/478))
- chore: update nyc and eslint configs ([#477](https://github.com/googleapis/nodejs-spanner/pull/477))
- chore: fix publish.sh permission +x ([#475](https://github.com/googleapis/nodejs-spanner/pull/475))
- fix(build): fix Kokoro release script ([#474](https://github.com/googleapis/nodejs-spanner/pull/474))
- build: add Kokoro configs for autorelease ([#473](https://github.com/googleapis/nodejs-spanner/pull/473))
- chore: always nyc report before calling codecov ([#469](https://github.com/googleapis/nodejs-spanner/pull/469))
- chore: nyc ignore build/test by default ([#468](https://github.com/googleapis/nodejs-spanner/pull/468))
- fix(build): fix system key decryption ([#460](https://github.com/googleapis/nodejs-spanner/pull/460))
- chore: temporarily disable gts ([#534](https://github.com/googleapis/nodejs-spanner/pull/534))

## v2.2.1

11-28-2018 10:43 PST


### Implementation Changes
- Update package.json to include the build directory ([#454](https://github.com/googleapis/nodejs-spanner/pull/454))

## v2.2.0

11-27-2018 09:13 PST


### Implementation Changes
- fix: transaction async error handling that not thrown the full error ([#447](https://github.com/googleapis/nodejs-spanner/pull/447))
- fix(transaction): accept json options in run/runStream ([#446](https://github.com/googleapis/nodejs-spanner/pull/446))
- refactor(transaction): error handling ([#360](https://github.com/googleapis/nodejs-spanner/pull/360))
- refactor(ts): enable noImplicitThis in the tsconfig ([#411](https://github.com/googleapis/nodejs-spanner/pull/411))
- refactor(ts): use import/export for local files ([#408](https://github.com/googleapis/nodejs-spanner/pull/408))
- refactor(ts): add type packages for many things ([#406](https://github.com/googleapis/nodejs-spanner/pull/406))
- refactor(ts): convert tests to typescript ([#404](https://github.com/googleapis/nodejs-spanner/pull/404))
- refactor(typescript): rename src and system-test files to *.ts ([#402](https://github.com/googleapis/nodejs-spanner/pull/402))
- refactor(typescript): perform initial TypeScript conversion ([#384](https://github.com/googleapis/nodejs-spanner/pull/384))
- fix: Only run mutations inside of a transaction. ([#361](https://github.com/googleapis/nodejs-spanner/pull/361))

### New Features
- feat(session): add label support ([#373](https://github.com/googleapis/nodejs-spanner/pull/373))

### Dependencies
- chore(deps): update dependency @types/sinon to v5.0.7 ([#444](https://github.com/googleapis/nodejs-spanner/pull/444))
- fix: Pin @types/sinon to last compatible version ([#443](https://github.com/googleapis/nodejs-spanner/pull/443))
- chore(deps): update dependency @types/p-queue to v3 ([#440](https://github.com/googleapis/nodejs-spanner/pull/440))
- fix(deps): update dependency google-gax to ^0.22.0 ([#435](https://github.com/googleapis/nodejs-spanner/pull/435))
- chore(deps): update dependency gts to ^0.9.0 ([#434](https://github.com/googleapis/nodejs-spanner/pull/434))
- chore(deps): update dependency @google-cloud/nodejs-repo-tools to v3 ([#429](https://github.com/googleapis/nodejs-spanner/pull/429))
- chore(deps): update dependency @types/is to v0.0.21 ([#426](https://github.com/googleapis/nodejs-spanner/pull/426))
- fix(deps): update dependency through2 to v3 ([#423](https://github.com/googleapis/nodejs-spanner/pull/423))
- chore: remove unused google-proto-files dep ([#421](https://github.com/googleapis/nodejs-spanner/pull/421))
- chore(deps): update dependency eslint-plugin-node to v8 ([#407](https://github.com/googleapis/nodejs-spanner/pull/407))
- refactor: drop dependency on delay ([#383](https://github.com/googleapis/nodejs-spanner/pull/383))
- fix(deps): update dependency google-proto-files to ^0.17.0 ([#369](https://github.com/googleapis/nodejs-spanner/pull/369))
- chore(deps): update dependency sinon to v7 ([#371](https://github.com/googleapis/nodejs-spanner/pull/371))

### Documentation
- docs(samples): updated samples code to use async await ([#385](https://github.com/googleapis/nodejs-spanner/pull/385))
- Add Cloud Spanner DML/PDML samples. ([#366](https://github.com/googleapis/nodejs-spanner/pull/366))

### Internal / Testing Changes
- chore: add synth.metadata
- test: fix broken tests ([#441](https://github.com/googleapis/nodejs-spanner/pull/441))
- refactor(samples): convert ava tests to mocha ([#400](https://github.com/googleapis/nodejs-spanner/pull/400))
- chore: update eslintignore config ([#433](https://github.com/googleapis/nodejs-spanner/pull/433))
- chore(build): fix lint rules and build for generated code ([#430](https://github.com/googleapis/nodejs-spanner/pull/430))
- chore: drop contributors from multiple places ([#427](https://github.com/googleapis/nodejs-spanner/pull/427))
- chore: use latest npm on Windows ([#425](https://github.com/googleapis/nodejs-spanner/pull/425))
- fix: update source location for synth ([#422](https://github.com/googleapis/nodejs-spanner/pull/422))
- fix: re-enable linting and formatting ([#420](https://github.com/googleapis/nodejs-spanner/pull/420))
- chore: improve typescript config and types ([#417](https://github.com/googleapis/nodejs-spanner/pull/417))
- chore: update CircleCI config ([#416](https://github.com/googleapis/nodejs-spanner/pull/416))
- chore: run gts fix ([#413](https://github.com/googleapis/nodejs-spanner/pull/413))
- chore: remove old issue template ([#397](https://github.com/googleapis/nodejs-spanner/pull/397))
- chore: update issue templates ([#401](https://github.com/googleapis/nodejs-spanner/pull/401))
- build: run tests on node11 ([#395](https://github.com/googleapis/nodejs-spanner/pull/395))
- chores(build): do not collect sponge.xml from windows builds ([#389](https://github.com/googleapis/nodejs-spanner/pull/389))
- chores(build): run codecov on continuous builds ([#386](https://github.com/googleapis/nodejs-spanner/pull/386))
- chore: update new issue template ([#382](https://github.com/googleapis/nodejs-spanner/pull/382))
- fix(tests): use unique label for tests ([#367](https://github.com/googleapis/nodejs-spanner/pull/367))
- build: fix codecov uploading on Kokoro ([#372](https://github.com/googleapis/nodejs-spanner/pull/372))
- build(kokoro): test with spanner key ([#364](https://github.com/googleapis/nodejs-spanner/pull/364))

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
