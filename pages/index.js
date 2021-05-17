import React,{useState, useCallback} from 'react';
import { Layout, Page, Card, EmptyState, Form, FormLayout, TextField, Button } from '@shopify/polaris';
import { ResourcePicker, TitleBar } from '@shopify/app-bridge-react';
import store from 'store-js';
import ResourceListWithProducts from '../components/ResourceList';


//const img = 'https://cdn.shopify.com/s/files/1/0757/9955/files/empty-state.svg';


//class Index extends React.Component {
 const Index = () => {
   const [apiKey, setApiKey] = useState('');
   const [storeUrl, setStoreUrl] = useState('');
 
  const handleSubmit = async () => {
    const resp = await fetch('http://localhost:4000/api/shopifyconnect', {
      method: 'POST',
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        apikey: apiKey,
        storeUrl: storeUrl
      })
    });
    const result = await resp.json();
    console.log(result)
    
    console.log('submission', apiKey);
  };

 const handleUrlChange = useCallback(
  (value) => setStoreUrl(value),
  [],
);

const handleApiKeyChange = useCallback(
  (value) => setApiKey(value),
  [],
);


  //render() {
   // const [value, setValue] = React.useState('Jaded Pixel');
    return (
      <Page>
        <Layout>
          <Layout.Section>
            <Card title="Connect to Tracksend" sectioned>
              <Form onSubmit={handleSubmit}>
                <FormLayout>
                <TextField
                    value={storeUrl}
                    label="Store Url"
                    type="url"
                    onChange={handleUrlChange}
                    placeholder="https://yourstore.myshopify.com"
                    helpText={
                      <span>
                        Enter the shopify store url for this store 
                     </span>
                    }
                  />

                  <TextField
                    value={apiKey}
                    label="Tracksend API Key"
                    type="password"
                    onChange={handleApiKeyChange}
                    placeholder="XXXXXXXXXXXXXXXX"
                    helpText={
                      <span>
                        Get your tracksend apikey from the integrations page on your tracksend dashboard.
                     </span>
                    }
                  />

                  <Button primary submit>Connect</Button>
                </FormLayout>
              </Form>
            </Card>
          </Layout.Section>
        </Layout>

      </Page>
    )
  
}
export default Index;