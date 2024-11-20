import {
  createAction,
  Property,
  PieceAuth,
  Validators,
  DynamicPropsValue,
  DropdownOption,
} from '@activepieces/pieces-framework';
import {
  HttpRequest,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { databaseAllFieldsForm } from '../common';
import { quotiAuth, QuotiAuthType } from '../..';
import axios from 'axios';
type CatalogResponse = {
  id: number;
  name: string;
  description: string;
  type: string;
  categoryId: number;
  solicitationType: string;
}[];
type QueryParams = {
  [key: string]: string | object; // Index signature
};

export const createTicket = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'createTicket',
  auth: quotiAuth,
  displayName: 'Criação',
  description: 'Cria uma Atividade, Prazo, Compromisso, processo, etc.',
  props: {
    catalogItem: Property.Dropdown<string>({
      displayName: 'Tipo',
      description: 'Escolha o tipo a ser criado',
      required: false,
      refreshers: [],
      async options({ auth }) {
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
          url: `https://api.quoti.cloud/api/v1/${authentication.org_slug}/resources/service_catalog_item?where[parent]=prazo`,
          headers: {
            BearerStatic: `${authentication.BearerStatic}`,
          },
          queryParams: {},
        };

        const response = await httpClient.sendRequest<CatalogResponse>(request);
        for (const item of response.body) {
          options.push({
            label: item.name,
            value: JSON.stringify({
              categoryId: item.categoryId,
              solicitationType: item.solicitationType,
            }),
          });
        }
        return {
          disabled: false,
          placeholder: 'Selecione o tipo de item a ser criado',
          options,
        };
      },
    }),
    form: Property.DynamicProperties({
      description: 'Dynamic Form',
      displayName: 'Dynamic Form',
      required: true,
      refreshers: ['catalogItem'],
      props: async ({ auth, catalogItem }) => {
        // const authentication = propsValue['authentication'];
        const authentication = auth as QuotiAuthType;
        if (!authentication) {
          return {
            disabled: true,
            placeholder: 'Connect quoti serviceAccount',
            options: [],
          };
        }
        const properties: DynamicPropsValue = {};
        const {categoryId, solicitationType} = JSON.parse(`${catalogItem}`)
        const responseTypes = await axios.get(
          `https://api.csm.quoti.cloud/api/v1/${authentication.org_slug}/ticket/types`,
          {
            headers: {
              BearerStatic: `${authentication.BearerStatic}`,
            },
            params: {
            },
          }
        );
        const type = responseTypes.data.find((t:any) => t.id === +solicitationType)
        const form = await axios.get(
          `https://api.quoti.cloud/api/v1/${authentication.org_slug}/forms/${type.formId}`,
          {
            headers: {
              BearerStatic: `${authentication.BearerStatic}`,
            },
          }
        );
        const fieldOptions = []
        for (const item of form.data.items) {
          fieldOptions.push({ label: item.title, value: item.name })
        }
        properties['fields'] = Property.Array({
          displayName: 'Fields',
          description: 'Enter fields',
          properties: {
            fieldName: Property.StaticDropdown({
              displayName: 'Campo',
              required: true,
              options: {
                options: fieldOptions,
              },
            }),
            fieldValue: Property.ShortText({
              displayName: 'Valor',
              required: true,
            }),
          },
          required: false,
          defaultValue: [],
        })
        return properties;
      },
    }),
    // fields: databaseAllFieldsForm,
    hasAdvancedProps: Property.Checkbox({
      displayName: 'Advanced',
      description: 'Check this box to show advanced configuration',
      required: false,
      defaultValue: false,
    }),
    advancedProps: Property.DynamicProperties({
      description: 'Dynamic Form',
      displayName: 'Dynamic Form',
      required: true,
      refreshers: ['hasAdvancedProps'],
      props: async (propsValue) => {
        // const authentication = propsValue['authentication'];
        const hasAdvancedProps = propsValue['hasAdvancedProps'];
        if (hasAdvancedProps) {
          const properties = {
            json: Property.Json({
              displayName: 'Body JSON',
              description:
                'If you use this option all previous settings will be OVERWRITE.',
              required: false,
              defaultValue: { a: 'b', date: '2024-22-01' },
            }),
          };

          return properties;
        } else return {};
      },
    }),
  },
  async run(context) {
    let body: QueryParams = {};
    if (
      context.propsValue['hasAdvancedProps'] &&
      Object.keys(context.propsValue['advancedProps']['json']).length > 0
    ) {
      body = context.propsValue['advancedProps']['json'];
    } else {
      // if(context.propsValue['fields'] && Object.keys(context.propsValue['fields']).length > 0){
      //   for (const prop of Object.keys(context.propsValue['fields'])){
      //     if(context.propsValue['fields'][prop]){
      //       body[prop] = context.propsValue['fields'][prop]
      //     }
      //   }
      // }
    }
    console.log('BODY', JSON.stringify(body));
    const res = await axios.post(
      `https://api.quoti.cloud/api/v1/${context.auth.org_slug}/resources/`,
      body,
      {
        headers: {
          BearerStatic: context.auth.BearerStatic, // Pass API key in headers
        },
      }
    );
    return res.data;
  },
});
