import {
  createAction,
  Property,
  PieceAuth,
  Validators,
  DynamicPropsValue
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import {databasesDropdown, filterField, databaseSelectedFieldsForm, databaseFields} from '../common'
import { quotiAuth, QuotiAuthType } from '../..';
import axios from 'axios';
type QueryParams = {
  [key: string]: string | object; // Index signature
};

export const updateDatabase = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'updateDatabase',
  auth: quotiAuth,
  displayName: 'Update from database',
  description: 'Update a specific item from a database',
  props: {
    databaseSlug: databasesDropdown,
    id: Property.ShortText({
      displayName: 'Id',
      description: 'Please enter a valid ID to update an item from the selected database.',
      required: false,
      defaultValue: '',
    }),
    fieldsUsed: databaseFields,
    updatedFields: databaseSelectedFieldsForm,
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
      refreshers: ['hasAdvancedProps', 'updatedFields'],
      props: async (propsValue) => {
        // const authentication = propsValue['authentication'];
        const hasAdvancedProps = propsValue['hasAdvancedProps']
        if(hasAdvancedProps) {
          console.log('Checking updatedFields before')
          console.log(JSON.stringify(propsValue['updatedFields']))
          const properties = {
            json: Property.Json({
              displayName: 'Body JSON',
              description: 'If you use this option all previous settings will be OVERWRITE.',
              required: false,
              defaultValue: propsValue['updatedFields'],
            })
          };
      
          return properties;
        } else return {
        }
      },
    })
    
    },
  async run(context) {
    let body: QueryParams = {
    }
    if(context.propsValue['hasAdvancedProps'] && Object.keys(context.propsValue['advancedProps']['json']).length > 0 ){
      body = context.propsValue['advancedProps']['json']
    } else {
      if(context.propsValue['updatedFields'] && Object.keys(context.propsValue['updatedFields']).length > 0){
        for (const prop of Object.keys(context.propsValue['updatedFields'])){
            body[prop] = context.propsValue['updatedFields'][prop] 
        }
      }
    }
    console.log('BODY', JSON.stringify(body))
    const res = await axios.put(`https://api.quoti.cloud/api/v1/${context.auth.org_slug}/resources/${context.propsValue['databaseSlug']}/${context.propsValue['id']}`,body, {
      headers: {
        BearerStatic: context.auth.BearerStatic, // Pass API key in headers
      }
    })
    return res.data;
  },
});
