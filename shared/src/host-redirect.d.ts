export const redirectAliasHost: (
  request: Request,
  options: {
    aliases: Readonly<Record<string, string>>;
    allowAnyOrigin?: boolean;
    skipOptions?: boolean;
    status: 301 | 308;
  },
) => null | Response;
