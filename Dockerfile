# Etapa de build
FROM node:20-alpine AS builder

WORKDIR /app

# Copia arquivos de dependência
COPY package.json yarn.lock ./

# Instala dependências
RUN yarn install

# Copia código e compila
COPY . .
RUN yarn build

# Etapa final (runtime)
FROM node:20-alpine

WORKDIR /app

# Copia apenas arquivos necessários
COPY package.json yarn.lock ./
RUN yarn install --omit=dev

# Copia os artefatos compilados
COPY --from=builder /app/dist ./dist

# Argumento para modo de execução
ARG MODE=producer
ENV MODE=${MODE}

CMD ["sh", "-c", "node dist/${MODE}/index.js"]
