let process = require('process');

import { ConfigParams } from 'pip-services3-commons-nodex';

import { RedisCache } from '../../src/cache/RedisCache';
import { CacheFixture } from '../fixtures/CacheFixture';

suite('RedisCache', ()=> {
    let _cache: RedisCache;
    let _fixture: CacheFixture;

    setup(async () => {
        let host = process.env['REDIS_SERVICE_HOST'] || 'localhost';
        let port = process.env['REDIS_SERVICE_PORT'] || 6379;

        _cache = new RedisCache();

        let config = ConfigParams.fromTuples(
            'connection.host', host,
            'connection.port', port
        );
        _cache.configure(config);

        _fixture = new CacheFixture(_cache);

        await _cache.open(null);
    });

    teardown(async () => {
        await _cache.close(null);
    });

    test('Store and Retrieve', async () => {
        await _fixture.testStoreAndRetrieve();
    });    

    test('Retrieve Expired', async () => {
        await _fixture.testRetrieveExpired();
    });    

    test('Remove', async () => {
        await _fixture.testRemove();
    });    
    
});
