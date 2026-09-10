import type { IServiceContainer, ServiceIdentifier, ServiceDescriptor } from '../types/di';

export class ServiceContainer implements IServiceContainer {
  private descriptors: Map<ServiceIdentifier, ServiceDescriptor> = new Map();
  private singletonInstances: Map<ServiceIdentifier, unknown> = new Map();
  private scopedInstances: Map<ServiceIdentifier, unknown> = new Map();
  private parent?: IServiceContainer;

  constructor(parent?: IServiceContainer) {
    this.parent = parent;
  }

  public has(identifier: ServiceIdentifier): boolean {
    return this.descriptors.has(identifier) || (this.parent?.has(identifier) ?? false);
  }

  public register<T>(descriptor: ServiceDescriptor<T>): void {
    this.descriptors.set(descriptor.identifier, descriptor);
  }

  public registerSingleton<T>(identifier: ServiceIdentifier<T>, value: T | { new (...args: unknown[]): T } | ((c: IServiceContainer) => T)): void {
    const descriptor: ServiceDescriptor<T> = {
      identifier,
      lifetime: 'singleton'
    };

    if (typeof value === 'function' && 'prototype' in value && (value as { prototype: { constructor: unknown } }).prototype?.constructor === value) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      descriptor.implementation = value as { new (...args: any[]): T };
    } else if (typeof value === 'function') {
      descriptor.factory = value as (c: IServiceContainer) => T;
    } else {
      descriptor.instance = value as T;
    }

    this.register(descriptor);
  }

  public registerTransient<T>(identifier: ServiceIdentifier<T>, value: { new (...args: unknown[]): T } | ((c: IServiceContainer) => T)): void {
    const descriptor: ServiceDescriptor<T> = {
      identifier,
      lifetime: 'transient'
    };

    if (typeof value === 'function' && 'prototype' in value && (value as { prototype: { constructor: unknown } }).prototype?.constructor === value) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      descriptor.implementation = value as { new (...args: any[]): T };
    } else {
      descriptor.factory = value as (c: IServiceContainer) => T;
    }

    this.register(descriptor);
  }

  public registerScoped<T>(identifier: ServiceIdentifier<T>, value: { new (...args: unknown[]): T } | ((c: IServiceContainer) => T)): void {
    const descriptor: ServiceDescriptor<T> = {
      identifier,
      lifetime: 'scoped'
    };

    if (typeof value === 'function' && 'prototype' in value && (value as { prototype: { constructor: unknown } }).prototype?.constructor === value) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      descriptor.implementation = value as { new (...args: any[]): T };
    } else {
      descriptor.factory = value as (c: IServiceContainer) => T;
    }

    this.register(descriptor);
  }

  public resolve<T>(identifier: ServiceIdentifier<T>): T {
    const descriptor = this.descriptors.get(identifier);

    if (!descriptor) {
      if (this.parent) {
        return this.parent.resolve<T>(identifier);
      }
      throw new Error(`Service not found: ${this.getIdentifierName(identifier)}`);
    }

    if (descriptor.lifetime === 'singleton') {
      if (!this.singletonInstances.has(identifier)) {
        if (this.parent) {
          // Singletons should ideally live in the root container
          return this.parent.resolve<T>(identifier);
        }
        this.singletonInstances.set(identifier, this.createInstance(descriptor));
      }
      return this.singletonInstances.get(identifier) as T;
    }

    if (descriptor.lifetime === 'scoped') {
      if (!this.scopedInstances.has(identifier)) {
        this.scopedInstances.set(identifier, this.createInstance(descriptor));
      }
      return this.scopedInstances.get(identifier) as T;
    }

    // Transient
    return this.createInstance(descriptor);
  }

  public createScope(): IServiceContainer {
    const scope = new ServiceContainer(this);
    // Copy descriptors for resolution logic
    this.descriptors.forEach((val) => scope.register(val));
    return scope;
  }

  public clear(): void {
    this.descriptors.clear();
    this.singletonInstances.clear();
    this.scopedInstances.clear();
  }

  private createInstance<T>(descriptor: ServiceDescriptor<T>): T {
    if (descriptor.instance !== undefined) {
      return descriptor.instance;
    }

    if (descriptor.factory) {
      return descriptor.factory(this);
    }

    if (descriptor.implementation) {
      return new descriptor.implementation();
    }

    throw new Error(`Unable to create instance for ${this.getIdentifierName(descriptor.identifier)}`);
  }

  private getIdentifierName(identifier: ServiceIdentifier): string {
    if (typeof identifier === 'string') return identifier;
    if (typeof identifier === 'symbol') return identifier.toString();
    return identifier.name;
  }
}

export const globalContainer = new ServiceContainer();
