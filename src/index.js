import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";
import { setContext } from "@apollo/client/link/context";
import { split } from "@apollo/client";
import { WebSocketLink } from "@apollo/client/link/ws";
import { getMainDefinition } from "@apollo/client/utilities";

import "./styles/index.css";
import App from "./components/App";
import { AUTH_TOKEN } from "./constants";

import {
  ApolloProvider,
  ApolloClient,
  createHttpLink,
  InMemoryCache,
} from "@apollo/client";

// The GraphQL server will be running on localhost:4000
const httpLink = createHttpLink({
  uri: "http://localhost:4000",
});

// A middleware that's invoked everytime ApolloClient sends a request to the server
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem(AUTH_TOKEN);
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});

const wsLink = new WebSocketLink({
  uri: `ws://localhost:4000/graphql`, // subscriptions endpoint using websockets
  options: {
    reconnect: true,
    connectionParams: {
      authToken: localStorage.getItem(AUTH_TOKEN), // authenticating the websocket connection using the user's token
    },
  },
});

// route request to a specific middleware link
const link = split(
  // check whether the requested operation is a subscription
  ({ query }) => {
    const { kind, operation } = getMainDefinition(query);
    return kind === "OperationDefinition" && operation === "subscription";
  }, // if callback returns true, request forwarded to the link passed the second argument. otherwise to the third one
  wsLink,
  authLink.concat(httpLink)
);

const client = new ApolloClient({
  link,
  cache: new InMemoryCache(),
});

// The App is wrapped with the higher-order component ApolloProvider that gets passed the client as a prop
ReactDOM.render(
  <BrowserRouter>
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  </BrowserRouter>,
  document.getElementById("root")
);
