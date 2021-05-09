import { Callback, Context } from 'aws-lambda';

type CustomHandler<E extends {}, C = any> = (event: E, context: Context, callback: Callback<C>) => void;

interface LambdaEvent {
  id: number
}

interface Response {
  message: string
}

export type LambdaHandler = CustomHandler<LambdaEvent, Response>;
