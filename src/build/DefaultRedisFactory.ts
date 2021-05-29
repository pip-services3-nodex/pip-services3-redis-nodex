/** @module build */
import { Factory } from 'pip-services3-components-nodex';
import { Descriptor } from 'pip-services3-commons-nodex';

import { RedisCache } from '../cache/RedisCache';
import { RedisLock } from '../lock/RedisLock';

/**
 * Creates Redis components by their descriptors.
 * 
 * @see [[RedisCache]]
 * @see [[RedisLock]]
 */
export class DefaultRedisFactory extends Factory {
	private static readonly RedisCacheDescriptor = new Descriptor("pip-services", "cache", "redis", "*", "1.0");
	private static readonly RedisLockDescriptor = new Descriptor("pip-services", "lock", "redis", "*", "1.0");

	/**
	 * Create a new instance of the factory.
	 */
	public constructor() {
        super();
		this.registerAsType(DefaultRedisFactory.RedisCacheDescriptor, RedisCache);
		this.registerAsType(DefaultRedisFactory.RedisLockDescriptor, RedisLock);
	}
}