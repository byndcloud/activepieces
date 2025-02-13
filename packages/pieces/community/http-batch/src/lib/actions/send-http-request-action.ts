import {
  httpClient,
  HttpError,
  HttpHeaders,
  HttpRequest,
  QueryParams,
} from '@activepieces/pieces-common';
import {
  createAction,
  DynamicPropsValue,
  Property,
} from '@activepieces/pieces-framework';
import { assertNotNullOrUndefined } from '@activepieces/shared';
import FormData from 'form-data';
import { httpMethodDropdown } from '../common/props';
// @ts-expect-error this library dont supports types
import {map} from 'native-bluebird'

export const httpSendRequestAction = createAction({
  name: 'send_request',
  displayName: 'Send batches of HTTP requests',
  description: 'Send batches of HTTP requests',
  props: {
    requests: Property.Json({
      displayName: 'Requests JSON',
      required: true,
      defaultValue: [{"method": "POST", "url": "https://example.com", "headers": {}, "queryParams": {}, "body": {}}]
    }),
    concurrency: Property.Number({
      displayName: 'Concurrency',
      description: 'Enter a number',
      required: true,
      defaultValue: 5
    }),
    timeout: Property.Number({
      displayName: 'Timeout(in seconds)',
      required: false,
    }),
    failsafe: Property.Checkbox({
      displayName: 'No Error on Failure',
      required: false,
    }),
  },
  errorHandlingOptions: {
    continueOnFailure: { hide: true },
    retryOnFailure: { defaultValue: true },
  },
  async run(context) {
    const {failsafe} = context.propsValue
    const requests = context.propsValue.requests as unknown as HttpRequest[];
    return await map(requests, async(request: HttpRequest) => {
      assertNotNullOrUndefined(request.method, 'Method');
      assertNotNullOrUndefined(request.url, 'URL');

      try{ 
        request.timeout = request.timeout ? request.timeout * 1000 : 0
        return await httpClient.sendRequest(request);
      } catch (error) {
        if (failsafe) {
          return (error as HttpError).errorMessage();
        }
  
        throw error;
      }
    }, {concurrency: context.propsValue.concurrency})
    
  },
});
