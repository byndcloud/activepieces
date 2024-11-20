import { quotiAuth, QuotiAuthType } from '../../';
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
export const databaseTrigger = createTrigger({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  auth: quotiAuth,
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
        }),
        type: Property.StaticDropdown<string>({
          displayName: 'Tipo da atividade',
          description: 'Filtre o evento para que aconteça apenas quando for:',
          required: true,
            options: {
              options: [
                { label: 'Audiência', value: 'audiencia' },
                { label: 'Prazo', value: 'prazo' },
                { label: 'Compromisso', value: 'compromisso' },
                { label: 'Diligência', value: 'diligencia' }
              ],
          },
        }),
        subType: Property.Dropdown<string>({
          displayName: 'Subtipo da atividade',
          description: 'Filtre o evento para que aconteça apenas quando for:',
          required: false,
          refreshers: ['type'],
          async options({ auth, type }) {
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
              url: `https://api.quoti.cloud/api/v1/${authentication.org_slug}/forms/100327`,
              headers: {
                BearerStatic: `${authentication.BearerStatic}`,
              },
              queryParams: {
              },
            };
        
            const response = await httpClient.sendRequest<FormResponse>(
              request
            );
            const values = response.body.items.find(i => i.name === `subtipo_${type}`)?.selectableValues
            if(values){
              for (const key of values) {
                options.push({ label: key, value: key });
              }
            }
            return {
              disabled: false,
              placeholder: 'Selecione o subtipo',
              options,
            };
          },
        })
        },
  sampleData: {},
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    // implement webhook creation logic
    console.log('Checking auth=> ', context.auth)
    let webhookUrl = context.webhookUrl
    // Quando usamos isso as chamadas obrigatoriamente precisarão aguardar o final do fluxo
    webhookUrl += '/sync'
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
        conditions: null,
        id: null,
      },
      {
        headers: {
          BearerStatic:
            context.auth.BearerStatic
        },
      }
    );
    console.log(
      'Em tese está habilitado o webhook na URL',
      webhookUrl
    );
    console.log(JSON.stringify(webhook.data));
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
        console.error('Error disabling webhook', e)
    }
    }
  },
  async run(context) {
    return [context.payload.body];
  },
});

interface WebhookInformation {
  id: number;
}
