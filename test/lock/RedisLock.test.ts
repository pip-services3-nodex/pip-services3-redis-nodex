import { ConfigParams } from 'pip-services3-commons-nodex';

import { RedisLock } from '../../src/lock/RedisLock';
import { LockFixture } from '../fixtures/LockFixture';

suite('RedisLock', ()=> {
    let _lock: RedisLock;
    let _fixture: LockFixture;

    setup(async () => {
        let host = process.env['REDIS_SERVICE_HOST'] || 'localhost';
        let port = process.env['REDIS_SERVICE_PORT'] || 6379;

        _lock = new RedisLock();

        let config = ConfigParams.fromTuples(
            'connection.host', host,
            'connection.port', port
        );
        _lock.configure(config);

        _fixture = new LockFixture(_lock);

        await _lock.open(null);
    });

    teardown(async () => {
        await _lock.close(null);
    });

    test('Try Acquire Lock', async () => {
        await _fixture.testTryAcquireLock();
    });

    test('Acquire Lock', async () => {
        await _fixture.testAcquireLock();
    });

    test('Release Lock', async () => {
        await _fixture.testReleaseLock();
    });

});
