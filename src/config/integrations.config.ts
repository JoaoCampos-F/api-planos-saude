import { registerAs } from '@nestjs/config';

export default registerAs('integrations', () => ({
  unimed: {
    api: {
      url: process.env.UNIMED_API_URL,
      user: process.env.UNIMED_API_USER,
      password: process.env.UNIMED_API_PASSWORD,
    },
    soap: {
      wsdl: process.env.UNIMED_SOAP_WSDL,
      login: process.env.UNIMED_SOAP_LOGIN,
      senha: process.env.UNIMED_SOAP_SENHA,
    },
  },
}));
