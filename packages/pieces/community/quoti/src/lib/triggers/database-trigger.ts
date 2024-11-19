import { quotiAuth } from '../../';
import {databasesDropdown, eventsDropdown} from '../common'
import axios from 'axios';
import {
  PiecePropValueSchema,
  TriggerStrategy,
  createTrigger,
  Property
} from '@activepieces/pieces-framework';
import { config } from 'process';

export const databaseTrigger = createTrigger({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  auth: quotiAuth,
  name: 'databaseTrigger',
  displayName: 'Database Trigger',
  description:
    'Define triggers that will be call whenever a data on a table is: retrieved, deleted, ',
    props: {
        databaseSlug: databasesDropdown,
        events: eventsDropdown,
        synchronous: Property.Checkbox({
          displayName: 'Synchronous responses',
          description: 'useful for returning errors and preventing the action from being executed. Remember to setup the respond HTTP node at the end.',
          required: false,
          defaultValue: false,
        })
        },
  sampleData: {},
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    // implement webhook creation logic
    console.log('Checking auth=> ', context.auth)
    // const ngrokUrl =
    //   'https://829e-2804-14d-5487-8288-48f9-a6fd-628c-d418.ngrok-free.app';
    // const localhostUrl = 'http://localhost:4200';
    let webhookUrl = context.webhookUrl
    if(!webhookUrl.endsWith('/test') &&  context.propsValue['synchronous']){
      webhookUrl += '/sync'
    }
    const webhook = await axios.post(
      `https://api.quoti.cloud/api/v1/${context.auth.org_slug}/hooks`,
      {
        resourceName: context.propsValue['databaseSlug'],
        resourceType: 'table',
        active: true,
        handler: {
          url: webhookUrl,
          type: 'http',
        },
        Events: context.propsValue['events']?.map((e) => {
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
