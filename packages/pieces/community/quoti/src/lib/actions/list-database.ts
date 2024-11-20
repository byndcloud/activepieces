import {
  createAction,
  Property,
  PieceAuth,
  Validators,
  DynamicPropsValue
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import {databasesDropdown, filterField, databaseFields, databaseSelectedFieldsForm} from '../common'
import { quotiAuth } from '../..';
import axios from 'axios';
type QueryParams = {
  [key: string]: string | object; // Index signature
};

export const listDatabase = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'listDatabase',
  auth: quotiAuth,
  displayName: 'List from database',
  description: 'List items from a database',
  props: {
    databaseSlug: databasesDropdown,
    fieldsUsed: databaseFields,
    filterFields: databaseSelectedFieldsForm,
    filterOperator: Property.StaticDropdown({
      displayName: `Filter Operator`,
      description: ``,
      required: false,
      defaultValue: 'AND',
      options: {
        options: [{label: `AND`, value: `AND`}, {label: `OR`, value: `OR`}]
      },
    }),
    limit: Property.ShortText({
      displayName: 'Limit',
      description: 'Enter a value',
      required: true,
      defaultValue: '25',
      validators: [Validators.pattern(/^[0-9]+$/)]
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
      refreshers: ['hasAdvancedProps', 'filterFields', 'filterOperator'],
      props: async (propsValue) => {
        // const authentication = propsValue['authentication'];
        const hasAdvancedProps = propsValue['hasAdvancedProps']
        if(hasAdvancedProps) {
          let where: {
            [key: string]: any;
          } = {}
          const filterOperator = `${propsValue['filterOperator']}`;
          if(propsValue['filterFields'] && Object.keys(propsValue['filterFields']).length > 0){
            for (const prop of Object.keys(propsValue['filterFields'])){
              where[prop] = propsValue['filterFields'][prop]
            }
          }
          if(filterOperator &&  filterOperator === 'OR'){
            where = {
              or: where
            }
          }
          const properties = {
            json: Property.Json({
              displayName: 'Advanced JSON',
              description: 'If you use this option all previous filter and settings will be OVERWRITE.',
              required: false,
              defaultValue: {"where": where, "limit": 25, "params": {}},
            })
          };
      
          return properties;
        } else return {
        }
      },
    })
    
    },
  async run(context) {
    let queryParams: QueryParams = {
      limit: `${context.propsValue['limit']}`
    }
    const where: {
      [key: string]: any;
    } = {}
    if(context.propsValue['hasAdvancedProps'] && context.propsValue['advancedProps'] && context.propsValue['advancedProps']['json'] && Object.keys(context.propsValue['advancedProps']['json']).length > 0 ){
      queryParams = context.propsValue['advancedProps']['json']
    } else{
      if(context.propsValue['filterFields'] && Object.keys(context.propsValue['filterFields']).length > 0){
        for (const prop of Object.keys(context.propsValue['filterFields'])){
          where[prop] = context.propsValue['filterFields'][prop]
        }
      }
      if(context.propsValue['filterOperator'] && context.propsValue['filterOperator'] === 'OR'){
        queryParams['where'] = {
          or: where
        }
      } else {
        queryParams['where'] = where
      }
    }
    const res = await axios.get(`https://api.quoti.cloud/api/v1/${context.auth.org_slug}/resources/${context.propsValue['databaseSlug']}`, {
      headers: {
        BearerStatic: context.auth.BearerStatic, // Pass API key in headers
      },
      params: queryParams
    })
    return res.data;
  },
});
