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
import { legisAuth, QuotiAuthType } from '../..';
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

export function isWeekday(date: Date): boolean {
  const day = date.getDay();
  return day !== 0 && day !== 6;
}
export function addDaysUtils(date: Date, days: number): Date {
  let diasAdd = 0;
  while (diasAdd < days) {
    date.setDate(date.getDate() + 1);
    if (isWeekday(date)) {
      diasAdd++;
    }
  }
  return date;
}
export function addDays(date: Date, days: number): Date {
  date.setDate(date.getDate() + days);
  return date;
}
export function subtractDaysUtils(date: Date, days: number): Date {
  let diasSub = 0;
  while (diasSub < days) {
    date.setDate(date.getDate() - 1);
    if (isWeekday(date)) {
      diasSub++;
    }
  }
  return date;
}
export function subtractDays(date: Date, days: number): Date {
  date.setDate(date.getDate() - days);
  return date;
}

export const createTicket = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'createTicket',
  auth: legisAuth,
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
              label: item.name,
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
        const {label, categoryId, solicitationType} = JSON.parse(`${catalogItem}`)
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
    data: Property.DynamicProperties({
      description: 'Dynamic Form',
      displayName: 'Dynamic Form',
      required: true,
      refreshers: [],
      props: async ({ auth }) => {
        // const authentication = propsValue['authentication'];
        const authentication = auth as QuotiAuthType;
        if (!authentication) {
          return {
            disabled: true,
            placeholder: 'Connect quoti serviceAccount',
            options: [],
          };
        }
        const properties: DynamicPropsValue =  {
          isWeekdaysOnly: Property.Checkbox({
            displayName: 'Somente dias úteis?',
            description: 'Indica se devem ser considerados somente dias úteis ou dias corridos.',
            required: false,
            defaultValue: false,
          }),
          incrementalCount: Property.Checkbox({
            displayName: 'Contagem crescente?',
            description: 'Contagem crescente indica contar prazo a partir da data de abertura, caso contrário é contado decrescente a partir da data do atividade que foi utilizado como gatilho.',
            required: false,
            defaultValue: false,
          }),
          totalDays:  Property.ShortText({
            displayName: 'Quantidade de dias',
            description: 'Parâmetro a ser utilizado para cálculo da data limite para conclusão da atividade a ser criada.',
            required: true,
          }),
          dateActivity: Property.ShortText({
            displayName: 'Data da atividade (gatilho)',
            description: 'Parâmetro a ser utilizado para determinar a data da atividade que serviu para gatilho. Para encontrar siga: Atividade -> AdditionalInfo -> data_hora',
            required: true,
          }),
          dateCreated: Property.ShortText({
            displayName: 'Data da criação de atividade (gatilho)',
            description: 'Parâmetro a ser utilizado para determinar a data da criação da atividade que serviu para gatilho.  Para encontrar siga: Atividade -> AdditionalInfo -> created_at',
            required: true,
          }),
      };
        return properties;
      },

    }),

    process: Property.ShortText({
      displayName: 'Processo',
      required: true,
      description: 'Parâmetro a ser utilizado para determinar a qual processo a atividade estará vinculada. Para encontrar o número do processo, siga o seguinte caminho: processo -> description.',
    }),
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
        if(context.propsValue['form'] && Object.keys(context.propsValue['form']).length > 0) {
          context.propsValue['form']['fields'].forEach((field: { fieldName: any; fieldValue: any; }) => {
            const fieldName = field.fieldName;
            const fieldValue = field.fieldValue;
            body[fieldName] = fieldValue;
            if (context.propsValue['data']) {
              const dateObject = context.propsValue['data'];
              const { totalDays, isWeekdaysOnly, incrementalCount, dateActivity, dateCreated } = dateObject;
              const days = parseInt(totalDays, 10);
              if (isNaN(days)) {
                throw new Error("A quantidade de dias deve ser um número válido.");
              }
              let dateCurrent;
              if (incrementalCount) {
                dateCurrent = dateCreated;
              } else {
                dateCurrent = dateActivity;
              }
              let limitDay: Date;
              if (isWeekdaysOnly) {
                if (incrementalCount) {
                  limitDay = addDaysUtils(new Date(dateCurrent), days);
                } else {
                  limitDay = subtractDaysUtils(new Date(dateCurrent), days);
                }
              } else {
                  if (incrementalCount) {
                    limitDay = addDays(new Date(dateCurrent), days);
                  } else {
                    limitDay = subtractDays(new Date(dateCurrent), days);
                  }
              }
              body['data_hora'] = limitDay.toISOString();
            }
        });
        }
    }
    const numberAdditionalProcess = await axios.get(
      `https://api.quoti.cloud/api/v1/${context.auth.org_slug}/resources/ticket_type_table_100265`,
      {
        params: {
          where: {
            Numero_do_processo: context.propsValue['process']
          }
        },
        headers: {
          BearerStatic: context.auth.BearerStatic,
        }
      }
    );
    if (!numberAdditionalProcess.data || numberAdditionalProcess.data.length === 0) {
      throw new Error('Nenhum processo adicional encontrado.');
    }
    const numberProcess = await axios.get(
      `https://api.csm.quoti.cloud/api/v1/${context.auth.org_slug}/tickets`,
      {
        params: {
          where: {
            ticketTypeFormResponseId: numberAdditionalProcess.data[0].id
          }
        },
        headers: {
          BearerStatic: context.auth.BearerStatic,
        }
      }
    );
    const {categoryId, solicitationType} = JSON.parse(`${context.propsValue['catalogItem']}`)
    const bodyProcess = {
      "description": 'Prazo compromisso',
      "body": "",
      "recipient":  Number(body['Responsavel']) || null,
      "ticketTypeId": Number(solicitationType),
      "categoryId": categoryId,
      "status": "pendente",
      "assignedTo": 100440,
      "assignedToUser": Number(body['Responsavel']) || null,
      "parentTicketId": numberProcess.data.results[0].id,
      "ticketTypeAdditionalInfo": {
        ...body,
        "forma_de_abertura": "Automática"
      }
    }
    const process = await axios.post(
      `https://api.csm.quoti.cloud/api/v1/${context.auth.org_slug}/tickets`,
      bodyProcess,
      {
        headers: {
          BearerStatic: context.auth.BearerStatic,
        },
      }
    )
    return process.data
  },
});


