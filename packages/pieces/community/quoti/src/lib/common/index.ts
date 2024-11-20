import {
  Property,
  OAuth2PropertyValue,
  DynamicPropsValue,
  PieceProperty,
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
  formId: number;
  columns: object;
}[];
type FormItem = {
  id: number;
  name: string;
  selectableValues: string[];
};
type FormResponse = {
  id: number;
  name: string;
  type: string;
  items: FormItem[];
};
export const databasesDropdown = Property.Dropdown<string>({
  displayName: 'Database',
  description: 'Database name',
  required: true,
  refreshers: [],
  async options({ auth }) {
    const authentication = auth as QuotiAuthType;
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
      options.push({ label: form.name, value: `${form.name}` });
    }

    return {
      disabled: false,
      placeholder: 'Select database',
      options,
    };
  },
});

export const allTablesDropdown = Property.Dropdown<string>({
  displayName: 'Database',
  description: 'Database name',
  required: true,
  refreshers: [],
  async options({ auth }) {
    const authentication = auth as QuotiAuthType;
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
        'where[types][1]': 'legacyModel',
        limit: '9999',
      },
    };

    const response = await httpClient.sendRequest<DatabaseListResponse>(
      request
    );

    for (const form of response.body) {
      options.push({ label: form.name, value: `${form.type}||${form.name}` });
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
      { label: 'beforeBulkUpdate', value: 'beforeBulkUpdate' },
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
    if(!databaseSlug) {
      return{
        disabled: true,
        placeholder: 'Select a database first',
        options: [],
      };
    }
    const properties: DynamicPropsValue = {};
    const response = await axios.get(
      `https://api.quoti.cloud/api/v1/${authentication.org_slug}/tables`,
      {
        headers: {
          BearerStatic: `${authentication.BearerStatic}`,
        },
        params: {
          where: { name: `${databaseSlug}` },
          listColumns: 'true',
        },
      }
    );
    const form = await axios.get(
      `https://api.quoti.cloud/api/v1/${authentication.org_slug}/forms/${response.data[0].formId}`,
      {
        headers: {
          BearerStatic: `${authentication.BearerStatic}`,
        },
      }
    );

    for (const item of form.data.items) {
      properties[item.name] = Property.ShortText({
        displayName: `${item.title}`,
        description: `Please enter a valid value to the column ${item.name}`,
        required: false,
        defaultValue: '',
      });
    }

    return properties;
  },
});

export const databaseSelectedFieldsForm = Property.DynamicProperties({
  description: 'Dynamic Form',
  displayName: 'Dynamic Form',
  required: true,
  refreshers: ['databaseSlug', 'fieldsUsed'],
  props: async ({ auth, databaseSlug, fieldsUsed }) => {
    const authentication = auth as QuotiAuthType;
    const selectedFields = fieldsUsed as string[];
    if (!authentication || !databaseSlug || !selectedFields || selectedFields.length === 0) {
      return {};
    }
    const properties: DynamicPropsValue = {};
    const response = await axios.get(
      `https://api.quoti.cloud/api/v1/${authentication.org_slug}/tables`,
      {
        headers: {
          BearerStatic: `${authentication.BearerStatic}`,
        },
        params: {
          where: { name: `${databaseSlug}` },
          listColumns: 'true',
        },
      }
    );
    const form = await axios.get(
      `https://api.quoti.cloud/api/v1/${authentication.org_slug}/forms/${response.data[0].formId}`,
      {
        headers: {
          BearerStatic: `${authentication.BearerStatic}`,
        },
      }
    );
    const filteredForm = form.data.items.filter((i: FormItem) =>
      selectedFields.includes(i.name)
    );
    for (const item of filteredForm) {
      properties[item.name] = mapQuotiDataType(item);
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
    const authentication = auth as QuotiAuthType;
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

export const databaseFields = Property.MultiSelectDropdown<string>({
  displayName: 'Fields',
  description: 'Field that will be used',
  required: false,
  refreshers: ['databaseSlug'],
  async options({ auth, databaseSlug }) {
    const authentication = auth as QuotiAuthType;
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
    const form = await axios.get(
      `https://api.quoti.cloud/api/v1/${authentication.org_slug}/forms/${response.body[0].formId}`,
      {
        headers: {
          BearerStatic: `${authentication.BearerStatic}`,
        },
      }
    );

    for (const item of form.data.items) {
      options.push({ label: item.title, value: item.name });
    }

    return {
      disabled: false,
      placeholder: 'Select all fields',
      options,
    };
  },
});
function mapQuotiDataType(item: any): PieceProperty {
  // Utilizando switch para mapear os tipos
  const inputType: string = item.type.name;
  switch (inputType) {
    case 'text':
      return Property.ShortText({
        displayName: `${item.title}`,
        description: `Please enter a valid value to the column ${item.name}`,
        required: item.required,
        defaultValue: '',
      });
    case 'enum':
    case 'multiplechoice':
      return Property.StaticDropdown({
        displayName: `${item.title}`,
        description: `Please enter a valid value to the column ${item.name}`,
        required: item.required,
        options: {
          options: item.selectableValues.map((item: string) => {
            return {label: item, value: item}
          })
        },
      });
    case 'selections':
    case 'enum_selections':
      return Property.StaticMultiSelectDropdown({
        displayName: `${item.title}`,
        description: `Please enter a valid value to the column ${item.name}`,
        required: item.required,
        options: {
          options: item.selectableValues.map((item: string) => {
            return {label: item, value: item}
          })
        },
      });
    case "float":
    case "double":
    case "number":
    case "money":
      return Property.Number({
        displayName: `${item.title}`,
        description: `Please enter a valid value to the column ${item.name}`,
        required: item.required,
      });
    case "textarea":
    case "richtext":
      return Property.LongText({
        displayName: `${item.title}`,
        description: `Please enter a valid value to the column ${item.name}`,
        required: item.required,
      });
    case "boolean":
      return Property.Checkbox({
        displayName: `${item.title}`,
        description: `Please enter a valid value to the column ${item.name}`,
        required: item.required,
        defaultValue: false,
      });
    case "datetime":
    case "date":
      return Property.DateTime({
        displayName: `${item.title}`,
        description: `Please enter a valid value to the column ${item.name}`,
        required: item.required,
        defaultValue: '2023-06-09T12:00:00Z',
      });
    case "json":
      return Property.Json({
        displayName: `${item.title}`,
        description: `Please enter a valid value to the column ${item.name}`,
        required: item.required,
        defaultValue: { key: 'value' },
      });
    // TBD - Considerar casos de múltiplos ou não
    // case "users/search":
    //   return "MultiSelectDropdown" || "DynamicProperties";
    // TBD - Considerar casos de múltiplos ou não
    // case "groups/list":
    //   return "MultiSelectDropdown" || "DynamicProperties";
    // TBD - Considerar casos de múltiplos ou não
    // case "usersProfiles/list":
    //   return "MultiSelectDropdown" || "DynamicProperties";
    // TBD - Considerar casos de múltiplos ou não
    // case "courses/list":
    //   return "MultiSelectDropdown" || "DynamicProperties";
    // TBD - Considerar casos de múltiplos ou não
    // case "resource/list":
    //   return "MultiSelectDropdown" || "DynamicProperties";
    // TBD - Considerar casos de múltiplos ou não
    // case "systemTable/list":
    //   return "MultiSelectDropdown" || "DynamicProperties";
    default:
      return Property.ShortText({
        displayName: `${item.title}`,
        description: `Please enter a valid value to the column ${item.name}`,
        required: item.required,
        defaultValue: '',
      }); // Retorno padrão para tipos desconhecidos
  }
}
