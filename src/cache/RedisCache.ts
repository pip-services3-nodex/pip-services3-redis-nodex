/** @module cache */
import { ConfigParams } from 'pip-services3-commons-nodex';
import { IConfigurable } from 'pip-services3-commons-nodex';
import { IReferences } from 'pip-services3-commons-nodex';
import { IReferenceable } from 'pip-services3-commons-nodex';
import { IOpenable } from 'pip-services3-commons-nodex';
import { InvalidStateException } from 'pip-services3-commons-nodex';
import { ConfigException } from 'pip-services3-commons-nodex';
import { ConnectionResolver } from 'pip-services3-components-nodex';
import { CredentialResolver } from 'pip-services3-components-nodex';
import { ICache } from 'pip-services3-components-nodex';

/**
 * Distributed cache that stores values in Redis in-memory database.
 * 
 * ### Configuration parameters ###
 * 
 * - connection(s):           
 *   - discovery_key:         (optional) a key to retrieve the connection from [[https://pip-services3-nodex.github.io/pip-services3-components-nodex/interfaces/connect.idiscovery.html IDiscovery]]
 *   - host:                  host name or IP address
 *   - port:                  port number
 *   - uri:                   resource URI or connection string with all parameters in it
 * - credential(s):
 *   - store_key:             key to retrieve parameters from credential store
 *   - username:              user name (currently is not used)
 *   - password:              user password
 * - options:
 *   - retries:               number of retries (default: 3)
 *   - timeout:               default caching timeout in milliseconds (default: 1 minute)
 *   - max_size:              maximum number of values stored in this cache (default: 1000)        
 *  
 * ### References ###
 * 
 * - <code>\*:discovery:\*:\*:1.0</code>        (optional) [[https://pip-services3-nodex.github.io/pip-services3-components-nodex/interfaces/connect.idiscovery.html IDiscovery]] services to resolve connection
 * - <code>\*:credential-store:\*:\*:1.0</code> (optional) Credential stores to resolve credential
 *
 * ### Example ###
 * 
 *     let cache = new RedisCache();
 *     cache.configure(ConfigParams.fromTuples(
 *       "host", "localhost",
 *       "port", 6379
 *     ));
 * 
 *     await cache.open("123");
 * 
 *     await cache.store("123", "key1", "ABC");
 *     let value = await cache.store("123", "key1"); // Result: "ABC"
 */
export class RedisCache implements ICache, IConfigurable, IReferenceable, IOpenable {
    private _connectionResolver: ConnectionResolver = new ConnectionResolver();
    private _credentialResolver: CredentialResolver = new CredentialResolver();

    private _timeout: number = 30000;
    private _retries: number = 3;

    private _client: any = null;

    /**
     * Creates a new instance of this cache.
     */
    public constructor() { }

    /**
     * Configures component by passing configuration parameters.
     * 
     * @param config    configuration parameters to be set.
     */
    public configure(config: ConfigParams): void {
        this._connectionResolver.configure(config);
        this._credentialResolver.configure(config);

        this._timeout = config.getAsIntegerWithDefault('options.timeout', this._timeout);
        this._retries = config.getAsIntegerWithDefault('options.retries', this._retries);
    }

    /**
     * Sets references to dependent components.
     * 
     * @param references 	references to locate the component dependencies. 
     */
    public setReferences(references: IReferences): void {
        this._connectionResolver.setReferences(references);
        this._credentialResolver.setReferences(references);
    }

    /**
     * Checks if the component is opened.
     * 
     * @returns true if the component has been opened and false otherwise.
     */
    public isOpen(): boolean {
        return this._client != null;
    }

    /**
     * Opens the component.
     * 
     * @param correlationId 	(optional) transaction id to trace execution through call chain.
     */
    public async open(correlationId: string): Promise<void> {
        let connection = await this._connectionResolver.resolve(correlationId);
        if (connection == null) {
            throw new ConfigException(
                correlationId,
                'NO_CONNECTION',
                'Connection is not configured'
            );
        }

        let credential = await this._credentialResolver.lookup(correlationId);

        let options: any = {
            // connect_timeout: this._timeout,
            // max_attempts: this._retries,
            retry_strategy: (options) => { return this.retryStrategy(options); }
        };

        if (connection.getUri() != null) {
            options.url = connection.getUri();
        } else {
            options.host = connection.getHost() || 'localhost';
            options.port = connection.getPort() || 6379;
        }

        if (credential != null) {
            options.password = credential.getPassword();
        }

        let redis = require('redis');
        this._client = redis.createClient(options);
    }

    /**
     * Closes component and frees used resources.
     * 
     * @param correlationId 	(optional) transaction id to trace execution through call chain.
     */
    public async close(correlationId: string): Promise<void> {
        if (this._client == null) return;

        await new Promise<void>((resolve, reject) => {
            this._client.quit((err) => {
                if (err != null) {
                    reject(err);
                    return;
                }
                resolve();
            });
        });

        this._client = null;
    }

    private checkOpened(correlationId: string): void {
        if (!this.isOpen()) {
            throw new InvalidStateException(
                correlationId,
                'NOT_OPENED',
                'Connection is not opened'
            );
        }
    }

    private retryStrategy(options: any): any {
        if (options.error && options.error.code === 'ECONNREFUSED') {
            // End reconnecting on a specific error and flush all commands with
            // a individual error
            return new Error('The server refused the connection');
        }
        if (options.total_retry_time > this._timeout) {
            // End reconnecting after a specific timeout and flush all commands
            // with a individual error
            return new Error('Retry time exhausted');
        }
        if (options.attempt > this._retries) {
            // End reconnecting with built in error
            return undefined;
        }
        // reconnect after
        return Math.min(options.attempt * 100, 3000);
    }

    /**
     * Retrieves cached value from the cache using its key.
     * If value is missing in the cache or expired it returns null.
     * 
     * @param correlationId     (optional) transaction id to trace execution through call chain.
     * @param key               a unique value key.
     * @returns a retrieve cached value or <code>null</code> if nothing was found.
     */
    public retrieve(correlationId: string, key: string): Promise<any> {
        this.checkOpened(correlationId);

        return new Promise<any>((resolve, reject) => {
            this._client.get(key, (err, value) => {
                if (err != null) {
                    reject(err);
                    return;
                }
                resolve(value ? JSON.parse(value) : value);
            });
        });
    }

    /**
     * Stores value in the cache with expiration time.
     * 
     * @param correlationId     (optional) transaction id to trace execution through call chain.
     * @param key               a unique value key.
     * @param value             a value to store.
     * @param timeout           expiration timeout in milliseconds.
     * @returns the stored value.
     */
    public store(correlationId: string, key: string, value: any, timeout: number): Promise<any> {
        this.checkOpened(correlationId);

        return new Promise<any>((resolve, reject) => {
            this._client.set(key, JSON.stringify(value), 'PX', timeout, (err, value) => {
                if (err != null) {
                    reject(err);
                    return;
                }
                resolve(value);
            });
        });
    }

    /**
     * Removes a value from the cache by its key.
     * 
     * @param correlationId     (optional) transaction id to trace execution through call chain.
     * @param key               a unique value key.
     * @returns the removed value.
     */
    public remove(correlationId: string, key: string): Promise<any> {
        this.checkOpened(correlationId);

        return new Promise<any>((resolve, reject) => {
            this._client.del(key, (err, value) => {
                if (err != null) {
                    reject(err);
                    return;
                }
                resolve(value ? JSON.parse(value) : value);
            });
        });
    }

}