import { legisAuth, QuotiAuthType } from '../../';
import axios from 'axios';
import {
  PiecePropValueSchema,
  TriggerStrategy,
  createTrigger,
  Property,
  DropdownOption
} from '@activepieces/pieces-framework';
import {HttpRequest,
  HttpMethod,
  httpClient} from '@activepieces/pieces-common'
type FormItems = {
  id: number;
  name: string;
  selectableValues: string[];
}[];
type FormResponse = {
  id: number;
  name: string;
  type: string;
  items: FormItems;
};
type BodyTicketCreated = {
  data: {
    requestData : {
      body: {
        id: number;
        ticketTypeId: number,
        parentTicketId: number,
        categoryId: number
      }
    }
  }
}
//const lastData: any = null;

export const databaseTrigger = createTrigger({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  auth: legisAuth,
  name: 'databaseTrigger',
  displayName: 'Nova atividade criada',
  description:
    'Inicia um fluxo quando uma nova atividade acontece',
    props: {
        category: Property.StaticDropdown<string>({
          displayName: 'Categoria',
          description: 'Filtre o evento para que aconteça apenas quando for:',
          required: true,
            options: {
              options: [
                { label: 'Abertura de Prazo', value: 'Abertura de Prazo' },
                { label: 'Cadastro Processo', value: 'Cadastro Processo' },
                { label: 'Conclusão PA', value: 'Conclusão PA' }
              ],
          },
        })
        },
  sampleData: {},
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    // implement webhook creation logic
    const webhookUrl = context.webhookUrl
    // Quando usamos isso as chamadas obrigatoriamente precisarão aguardar o final do fluxo
    //webhookUrl += '/sync'
    const condtions = context.propsValue
    let ticketType =  null
    if(condtions['category'] === 'Abertura de Prazo') {
       ticketType = 100050
    }
    else {
      ticketType = 100047
    }
    const webhook = await axios.post(
      `https://api.quoti.cloud/api/v1/${context.auth.org_slug}/hooks`,
      {
        resourceName: 'Tickets',
        resourceType: 'model',
        active: true,
        handler: {
          url: webhookUrl,
          type: 'http',
        },
        Events: ['afterCreate'].map((e) => {
            return {
                name: e,
                configs: { returnAfterData: ['afterUpdate'].includes(e) ? true : false, returnBeforeData: ['afterUpdate'].includes(e) ? true : false }
            }
        }),
        conditions: {
          all: [

            {
              "fact": 'requestData',
              "path": `$.body.ticketTypeId`,
              "value": [
                ticketType
              ],
              "operator": "in",
              "description": 'Hooks acionado quando a categoria for igual o tipo do trigger'

            }
          ]
        },
        id: null,
      },
      {
        headers: {
          BearerStatic:
            context.auth.BearerStatic
        },
      }
    );
    await context.store?.put<WebhookInformation>('_new_submission_trigger', {
      id: webhook.data.id,
    });
  },
  async onDisable(context) {
    // implement webhook deletion logic
    const response = await context.store?.get<WebhookInformation>(
      '_new_submission_trigger'
    );
    if (response !== null && response !== undefined) {
        try{
      const res = await axios.delete(
        `https://api.quoti.cloud/api/v1/${context.auth.org_slug}/hooks/${response.id}`,
        {
          headers: {
            BearerStatic:
              context.auth.BearerStatic
            },
        }
      );
      console.log(
        'Em tese está desabilitado o habilitado o webhook',
        res.status
      );
    } catch(e) {
      throw new Error(`Error disabling webhook: ${e}`);
    }
    }
  },
  async run(context) {
    const request  = context.payload.body as BodyTicketCreated
    const ticketId = request.data.requestData.body.id
    const ticketTypeId = request.data.requestData.body.ticketTypeId
    const parentTicketId = request.data.requestData.body.parentTicketId
    let response
    try {
      response = await axios.get(
        `https://api.csm.quoti.cloud/api/v1/${context.auth.org_slug}/tickets/${ticketId}`, {
          params: {
            additionalInfos: {
              ticketTypeId: ticketTypeId
            },

          },
          headers: {
            BearerStatic: context.auth.BearerStatic
          }
        }
      );
    } catch (error) {
      response = null;
      throw new Error(`Erro na requisição: ${error}`);
    }

    let responseProcess
    if (parentTicketId) {
      try {
        const response = await axios.get(
          `https://api.csm.quoti.cloud/api/v1/${context.auth.org_slug}/tickets/${parentTicketId}`, {
            params: {
              additionalInfos: {
                ticketTypeId: 100047
              }
            },
            headers: {
              BearerStatic: context.auth.BearerStatic
            }
          }
        );
        responseProcess = response.data;
      } catch (error) {
        responseProcess = null;
        throw new Error(`Erro na requisição: ${error}`);
      }
    }
    return [{
      ...request,
      atividade: response ? response.data : null,
      processo: responseProcess ? responseProcess : null,
    }];
  },
});


interface WebhookInformation {
  id: number;
}
