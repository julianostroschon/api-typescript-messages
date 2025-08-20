# API-TypeScript-messages

Install dependencies the project

```shell
yarn
```

Build the Project

```shell
yarn build
```

Run the Project

```shell
yarn start
```

### Endpoits

- `/api/v1/send`

```sh
curl --request POST \
  --url http://localhost:3005/api/v1/send \
  --header 'Content-Type: application/json' \
  --data '{
	"phonenumber": "<chatId>",
	"message": "Mensagem via API Messages."
}'
```
