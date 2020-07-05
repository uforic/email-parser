import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import { ApolloProvider, ApolloClient, InMemoryCache } from '@apollo/client';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import Mailbox from './Mailbox';

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

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
