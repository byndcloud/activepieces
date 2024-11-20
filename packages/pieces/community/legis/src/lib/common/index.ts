import {
  Property,
  OAuth2PropertyValue,
  DynamicPropsValue,
  DropdownOption,
} from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  AuthenticationType,
  httpClient,
  HttpHeader,
} from '@activepieces/pieces-common';
import { QuotiAuthType } from '../../index';
import axios from 'axios';
export type DatabaseListResponse = {
  id: number;
  name: string;
  type: string;
  columns: object;
}[];


export const databaseAllFieldsForm = Property.DynamicProperties({
    description: 'Dynamic Form',
    displayName: 'Dynamic Form',
    required: true,
    refreshers: ['databaseSlug'],
    props: async ({ auth, databaseSlug }) => {
      const authentication = auth as QuotiAuthType;
      if (!authentication) {
        return {
          disabled: true,
          placeholder: 'Connect quoti serviceAccount',
          options: [],
        };
      }
      const properties: DynamicPropsValue = {
      };
      const response = await axios.get(`https://api.quoti.cloud/api/v1/${authentication.org_slug}/tables`, {
        headers: {
          BearerStatic: `${authentication.BearerStatic}`,
        },
        params: {
          'where': {'name': `${databaseSlug}`},
          listColumns: 'true',
        }
      })
      const form = await axios.get(`https://api.quoti.cloud/api/v1/${authentication.org_slug}/forms/${response.data[0].formId}`,
        {
        headers: {
          BearerStatic: `${authentication.BearerStatic}`,
        }
      })
  
      for (const item of form.data.items) {
        properties[item.name] = Property.ShortText({
          displayName: `${item.title}`,
          description: `Please enter a valid value to the column ${item.name}`,
          required: false,
          defaultValue: '',
        })
      }
    
        return properties;
    },
  });
