declare module 'jsonwebtoken' {
  const jsonwebtoken: any;
  export default jsonwebtoken;
  export const sign: any;
  export const verify: any;
}

declare module 'node-fetch' {
  const fetch: typeof globalThis.fetch;
  export default fetch;
}
