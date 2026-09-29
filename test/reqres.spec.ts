import pactum from 'pactum';
import { SimpleReporter } from '../simple-reporter';
import { faker } from '@faker-js/faker';
import { StatusCodes } from 'http-status-codes';

describe('ReqRes API - Gestão de Usuários e Autenticação', () => {
  const p = pactum;
  const rep = SimpleReporter;
  const baseUrl = 'https://reqres.in/api';

  p.request.setDefaultTimeout(30000);

  beforeAll(() => {
    p.reporter.add(rep);
  });

  describe('Consultas (GET)', () => {
    it('Deve listar usuários com validação de paginação', async () => {
      await p
        .spec()
        .get(`${baseUrl}/users?page=2`)
        .expectStatus(StatusCodes.OK)
        .expectJsonSchema({
          type: 'object',
          properties: {
            page: { type: 'number' },
            per_page: { type: 'number' },
            total: { type: 'number' },
            data: { type: 'array' }
          },
          required: ['page', 'data']
        });
    });

    it('Deve consultar um usuário existente por ID', async () => {
      await p
        .spec()
        .get(`${baseUrl}/users/2`)
        .expectStatus(StatusCodes.OK)
        .expectJsonSchema({
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                email: { type: 'string' },
                first_name: { type: 'string' },
                last_name: { type: 'string' }
              },
              required: ['id', 'email', 'first_name', 'last_name']
            }
          }
        });
    });

    it('Deve retornar erro 404 ao buscar um usuário inexistente', async () => {
      await p
        .spec()
        .get(`${baseUrl}/users/999`) 
        .expectStatus(StatusCodes.NOT_FOUND);
    });
  });

  describe('Criação e Atualização POST, PUT, PATCH', () => {
    it('Deve cadastrar um novo usuário', async () => {
      await p
        .spec()
        .post(`${baseUrl}/users`)
        .withJson({
          name: faker.person.fullName(),
          job: faker.person.jobTitle()
        })
        .expectStatus(StatusCodes.CREATED)
        .expectJsonSchema({
          type: 'object',
          properties: {
            name: { type: 'string' },
            job: { type: 'string' },
            id: { type: 'string' },
            createdAt: { type: 'string' }
          },
          required: ['name', 'job', 'id', 'createdAt']
        });
    });

    it('Deve permitir cadastro de funcionário duplicado gerando IDs distintos', async () => {
      const funcionarioDuplicado = {
        name: 'Nathan Frassetto',
        job: 'Engenheiro de Software'
      };

      const idPrimeiroCadastro = await p
        .spec()
        .post(`${baseUrl}/users`)
        .withJson(funcionarioDuplicado)
        .expectStatus(StatusCodes.CREATED)
        .returns('id');

      const idSegundoCadastro = await p
        .spec()
        .post(`${baseUrl}/users`)
        .withJson(funcionarioDuplicado)
        .expectStatus(StatusCodes.CREATED)
        .returns('id');

      expect(idPrimeiroCadastro).not.toBe(idSegundoCadastro);
    });

    it('Deve atualizar todos os dados do usuário', async () => {
      await p
        .spec()
        .put(`${baseUrl}/users/2`)
        .withJson({
          name: faker.person.fullName(),
          job: 'Senior QA Analyst'
        })
        .expectStatus(StatusCodes.OK)
        .expectJsonSchema({
          type: 'object',
          properties: {
            name: { type: 'string' },
            job: { type: 'string' },
            updatedAt: { type: 'string' }
          },
          required: ['name', 'job', 'updatedAt']
        });
    });

    it('Deve atualizar parcialmente os dados do usuário', async () => {
      await p
        .spec()
        .patch(`${baseUrl}/users/2`)
        .withJson({
          job: 'Tech Lead'
        })
        .expectStatus(StatusCodes.OK)
        .expectJsonSchema({
          type: 'object',
          properties: {
            job: { type: 'string' },
            updatedAt: { type: 'string' }
          },
          required: ['job', 'updatedAt']
        });
    });
  });

  describe('Exclusão (DELETE)', () => {
    it('Deve excluir um usuário existente', async () => {
      await p
        .spec()
        .delete(`${baseUrl}/users/2`)
        .expectStatus(StatusCodes.NO_CONTENT);
    });
  });

  describe('Cenários Negativos (Erros 400)', () => {
    it('Deve falhar ao tentar registrar um usuário sem enviar a senha', async () => {
      await p
        .spec()
        .post(`${baseUrl}/register`)
        .withJson({
          email: 'sydney@fife'
        })
        .expectStatus(StatusCodes.BAD_REQUEST)
        .expectBodyContains('Missing password');
    });
  });

  afterAll(() => p.reporter.end());
});