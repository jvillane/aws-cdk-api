import { LambdaHandler } from './lambda.types';

export const handler: LambdaHandler = ({ id }, context, callback) => {
  callback(null, { message: `Id received: ${id}` });
}
