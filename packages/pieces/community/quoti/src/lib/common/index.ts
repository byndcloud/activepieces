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
type DatabaseListResponse = {
  id: number;
  name: string;
  type: string;
  columns: object;
}[];

export const databasesDropdown = Property.Dropdown<string>({
  displayName: 'Database',
  description: 'Database name',
  required: true,
  refreshers: [],
  async options({ auth }) {
    const authentication = auth as QuotiAuthType
    if (!authentication) {
      return {
        disabled: true,
        placeholder: 'Connect Quoti serviceAccount',
        options: [],
      };
    }
    const options: DropdownOption<string>[] = [];
    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `https://api.quoti.cloud/api/v1/${authentication.org_slug}/tables`,
      headers: {
        BearerStatic: `${authentication.BearerStatic}`,
      },
      queryParams: {
        'where[types][0]': 'table',
        limit: '9999',
      },
    };

    const response = await httpClient.sendRequest<DatabaseListResponse>(
      request
    );

    for (const form of response.body) {
      options.push({ label: form.name, value: form.name });
    }

    return {
      disabled: false,
      placeholder: 'Select database',
      options,
    };
  },
});

export const eventsDropdown = Property.StaticMultiSelectDropdown<string>({
  displayName: 'Events',
  description: 'Events that will be listened to',
  required: true,
    options: {
      options: [
        { label: 'afterCreate', value: 'afterCreate' },
        { label: 'afterDestroy', value: 'afterDestroy' },
        { label: 'afterUpdate', value: 'afterUpdate' },
        { label: 'afterUpsert', value: 'afterUpsert' },
        { label: 'beforeCreate', value: 'beforeCreate' },
        { label: 'beforeDestroy', value: 'beforeDestroy' },
        { label: 'beforeFind', value: 'beforeFind' },
        { label: 'beforeUpdate', value: 'beforeUpdate' },
        { label: 'beforeUpsert', value: 'beforeUpsert' },
        { label: 'afterBulkCreate', value: 'afterBulkCreate' },
        { label: 'afterBulkDestroy', value: 'afterBulkDestroy' },
        { label: 'afterBulkUpdate', value: 'afterBulkUpdate' },
        { label: 'beforeBulkCreate', value: 'beforeBulkCreate' },
        { label: 'beforeBulkDestroy', value: 'beforeBulkDestroy' },
        { label: 'beforeBulkUpdate', value: 'beforeBulkUpdate' }
      ],
  },
});

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

export const filterField = Property.Dropdown<string>({
    displayName: 'Filter Field',
    description: 'Field that will filter',
    required: false,
    refreshers: ['databaseSlug'],
    async options({ auth, databaseSlug }) {
    const authentication = auth as QuotiAuthType
      if (!authentication) {
        return {
          disabled: true,
          placeholder: 'Connect quoti serviceAccount',
          options: [],
        };
      }
      const options: DropdownOption<string>[] = [];
      const request: HttpRequest = {
        method: HttpMethod.GET,
        url: `https://api.quoti.cloud/api/v1/${authentication.org_slug}/tables`,
        headers: {
          BearerStatic: `${authentication.BearerStatic}`,
        },
        queryParams: {
          'where[name]': `${databaseSlug}`,
          listColumns: 'true',
        },
      };
  
      const response = await httpClient.sendRequest<DatabaseListResponse>(
        request
      );
  
      for (const key of Object.keys(response.body[0].columns)) {
        options.push({ label: key, value: key });
      }
  
      return {
        disabled: false,
        placeholder: 'Select a field to filter',
        options,
      };
    },
  });