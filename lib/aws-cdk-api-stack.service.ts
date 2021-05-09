import { OpenAPIV3 } from "openapi-types";

export function httpMethod(key: string) {
  key = key.toUpperCase();
  for (const httpMethod in OpenAPIV3.HttpMethods) {
    if (key === httpMethod) {
      return httpMethod.toLowerCase() as OpenAPIV3.HttpMethods;
    }
  }
  return undefined;
}

export function requestTemplate(path: string) {
  const pathVars: string[] = [];
  let match;
  while (true) {
    match = /{(\w+)}/g.exec(path);
    if (match === null) {
      break;
    }
    match && pathVars.push(match[1]);
    path = path.substring(match.index + match[0].length);
  }
  const pathParams = pathVars.map(value => `"${value}": $input.params().path.get('${value}')`);
  const body = `#if($input.body == ""), "body": $input.json('$') #end`;
  return `{ ${pathParams.join(', ')}${body} }`;
}

export function camelize(text: string) {
  let arr = text.split('-');
  let camelizedArray = arr.map(item => item.charAt(0).toUpperCase() + item.slice(1).toLowerCase());
  return camelizedArray.join('');
}
