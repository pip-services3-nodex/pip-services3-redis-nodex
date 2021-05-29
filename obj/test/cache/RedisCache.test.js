"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
let process = require('process');
const pip_services3_commons_nodex_1 = require("pip-services3-commons-nodex");
const RedisCache_1 = require("../../src/cache/RedisCache");
const CacheFixture_1 = require("../fixtures/CacheFixture");
suite('RedisCache', () => {
    let _cache;
    let _fixture;
    setup(() => __awaiter(void 0, void 0, void 0, function* () {
        let host = process.env['REDIS_SERVICE_HOST'] || 'localhost';
        let port = process.env['REDIS_SERVICE_PORT'] || 6379;
        _cache = new RedisCache_1.RedisCache();
        let config = pip_services3_commons_nodex_1.ConfigParams.fromTuples('connection.host', host, 'connection.port', port);
        _cache.configure(config);
        _fixture = new CacheFixture_1.CacheFixture(_cache);
        yield _cache.open(null);
    }));
    teardown(() => __awaiter(void 0, void 0, void 0, function* () {
        yield _cache.close(null);
    }));
    test('Store and Retrieve', () => __awaiter(void 0, void 0, void 0, function* () {
        yield _fixture.testStoreAndRetrieve();
    }));
    test('Retrieve Expired', () => __awaiter(void 0, void 0, void 0, function* () {
        yield _fixture.testRetrieveExpired();
    }));
    test('Remove', () => __awaiter(void 0, void 0, void 0, function* () {
        yield _fixture.testRemove();
    }));
});
//# sourceMappingURL=RedisCache.test.js.map