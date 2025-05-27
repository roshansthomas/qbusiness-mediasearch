import React from 'react';
import { Heading, Text, View, useAuthenticator } from '@aws-amplify/ui-react';

/**
 * Custom components for the AWS Amplify Authenticator
 * These components customize the login experience and add a greeting
 */

export const components = {
  Header() {
    return (
      <Heading level={3} padding="1rem">
        Amazon Q for Business
      </Heading>
    );
  },
  Footer() {
    return (
      <View textAlign="center" padding="1rem">
        <Text>&copy; Amazon Q for Business</Text>
      </View>
    );
  },
  SignIn: {
    Header() {
      return (
        <Heading level={3} padding="1rem">
          Welcome to Amazon Q for Business
        </Heading>
      );
    },
    Footer() {
      return (
        <View textAlign="center" padding="1rem">
          <Text>Sign in to access Amazon Q for Business</Text>
        </View>
      );
    },
  },
  // Add a greeting after successful authentication
  AuthenticatedRoute: {
    Header() {
      const { user } = useAuthenticator();
      const username = user?.username || user?.attributes?.email || 'User';
      
      return (
        <View padding="1rem" backgroundColor="#f0f7ff">
          <Heading level={3}>Welcome back, {username}!</Heading>
          <Text>You've successfully signed in to Amazon Q for Business</Text>
        </View>
      );
    }
  }
};

export const formFields = {
  signIn: {
    username: {
      placeholder: 'Enter your email',
      isRequired: true,
      label: 'Email',
    },
    password: {
      label: 'Password',
      placeholder: 'Enter your password',
      isRequired: true,
    }
  },
};