import { buildTableDefinitions, PRODUCTS_BY_CREATED_AT_INDEX, USERS_BY_ID_INDEX } from './tables';

describe('buildTableDefinitions', () => {
  const [users, products] = buildTableDefinitions({ users: 'dev-users', products: 'dev-products' });

  it('keys the users table by email', () => {
    expect(users).toMatchObject({
      TableName: 'dev-users',
      KeySchema: [{ AttributeName: 'email', KeyType: 'HASH' }],
    });
  });

  it('adds an index that finds a user by id', () => {
    expect(users?.GlobalSecondaryIndexes).toEqual([
      expect.objectContaining({
        IndexName: USERS_BY_ID_INDEX,
        KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
      }),
    ]);
  });

  it('keys the products table by id', () => {
    expect(products).toMatchObject({
      TableName: 'dev-products',
      KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
    });
  });

  it('adds an index that sorts products by creation time', () => {
    expect(products?.GlobalSecondaryIndexes).toEqual([
      expect.objectContaining({
        IndexName: PRODUCTS_BY_CREATED_AT_INDEX,
        KeySchema: [
          { AttributeName: 'listKey', KeyType: 'HASH' },
          { AttributeName: 'createdAtId', KeyType: 'RANGE' },
        ],
      }),
    ]);
  });

  it('defines every key attribute that a key schema uses', () => {
    for (const table of [users, products]) {
      const defined = table?.AttributeDefinitions?.map(({ AttributeName }) => AttributeName);
      const used = [
        ...(table?.KeySchema ?? []),
        ...(table?.GlobalSecondaryIndexes ?? []).flatMap((index) => index.KeySchema ?? []),
      ].map(({ AttributeName }) => AttributeName);

      expect(new Set(defined)).toEqual(new Set(used));
    }
  });
});
