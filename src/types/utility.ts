export type PromiseResolveType<P extends Promise<unknown>> = Parameters<
  Parameters<P['then']>[0]
>[0]

export type APIResolveType<
  P extends Promise<{ data: unknown; [k: string]: unknown }>,
> = PromiseResolveType<P>['data']
