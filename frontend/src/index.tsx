import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './components/App';
import { ApolloProvider, ApolloClient, InMemoryCache } from '@apollo/client';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import Mailbox from './components/Mailbox';

ReactDOM.render(
    <React.StrictMode>
        <ApolloProvider
            client={
                new ApolloClient({
                    cache: new InMemoryCache(),
                    uri: '/graphql/api',
                })
            }
        >
            <Router>
                <Switch>
                    <Route path="/mailbox">
                        <Mailbox />
                    </Route>
                    <Route path="/">
                        <App />
                    </Route>
                </Switch>
            </Router>
        </ApolloProvider>
    </React.StrictMode>,
    document.getElementById('root'),
);
