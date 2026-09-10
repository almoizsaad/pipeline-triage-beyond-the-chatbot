export type ServiceLifetime = 'singleton' | 'transient' | 'scoped';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ServiceIdentifier<T = any> = string | symbol | { new (...args: any[]): T };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ServiceFactory<T = any> = (container: IServiceContainer) => T;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ServiceDescriptor<T = any> {
  identifier: ServiceIdentifier<T>;
  factory?: ServiceFactory<T>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  implementation?: { new (...args: any[]): T };
  instance?: T;
  lifetime: ServiceLifetime;
}

export interface IServiceContainer {
  /**
   * Checks if a service is registered.
   */
  has(identifier: ServiceIdentifier): boolean;

  /**
   * Registers a service with the container.
   */
  register<T>(descriptor: ServiceDescriptor<T>): void;

  /**
   * Resolves a service by its identifier.
   */
  resolve<T>(identifier: ServiceIdentifier<T>): T;

  /**
   * Creates a scoped container.
   */
  createScope(): IServiceContainer;

  /**
   * Clears the container.
   */
  clear(): void;
}
