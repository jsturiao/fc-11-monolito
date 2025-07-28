# 🏗️ Arquitetura e Fluxo de Funcionamento - FC Monolito

## 📋 Visão Geral

O FC Monolito é uma aplicação monolítica modular que implementa os conceitos de **Clean Architecture**, **Domain-Driven Design (DDD)** e princípios **SOLID**. A arquitetura é organizada em módulos independentes que comunicam-se através de **Facades**, garantindo baixo acoplamento e alta coesão.

## 🎯 Arquitetura Modular

### **Padrão de Organização por Módulo**

Cada módulo segue a estrutura padrão da Clean Architecture:

```
módulo/
├── domain/           # Entidades e regras de negócio
├── usecase/          # Casos de uso (regras de aplicação)
├── gateway/          # Contratos de acesso a dados
├── repository/       # Implementação de persistência
├── facade/           # Interface externa do módulo
└── factory/          # Criação de objetos (Dependency Injection)
```

## 🔗 Módulos e suas Responsabilidades

### **1. @shared - Infraestrutura Compartilhada**

**Propósito**: Fornece elementos base para todos os módulos.

**Componentes**:
- `BaseEntity`: Classe base com ID, createdAt, updatedAt
- `AggregateRoot`: Interface para agregados DDD
- `Id`: Value Object para identificadores únicos
- `Address`: Value Object para endereços
- `UseCaseInterface`: Contrato base para casos de uso

### **2. Client Admin - Gestão de Clientes**

**Responsabilidade**: Administração completa de clientes para o backoffice.

**Entidades**:
```typescript
Client {
  id: Id
  name: string
  email: string
  document: string
  address: Address
  createdAt: Date
  updatedAt: Date
}
```

**Casos de Uso**:
- `AddClientUseCase`: Cadastrar novo cliente
- `FindClientUseCase`: Buscar cliente por ID

**Facade Interface**:
```typescript
interface ClientAdmFacadeInterface {
  add(input: AddClientFacadeInputDto): Promise<void>
  find(input: FindClientFacadeInputDto): Promise<FindClientFacadeOutputDto>
}
```

### **3. Product Admin - Gestão de Produtos (Backoffice)**

**Responsabilidade**: Administração de produtos com foco em estoque e preços de compra.

**Entidades**:
```typescript
Product {
  id: Id
  name: string
  description: string
  purchasePrice: number  // Preço de compra
  stock: number          // Controle de estoque
  createdAt: Date
  updatedAt: Date
}
```

**Casos de Uso**:
- `AddProductUseCase`: Cadastrar produto
- `CheckStockUseCase`: Verificar disponibilidade

**Facade Interface**:
```typescript
interface ProductAdmFacadeInterface {
  addProduct(input: AddProductFacadeInputDto): Promise<void>
  checkStock(input: CheckStockFacadeInputDto): Promise<CheckStockFacadeOutputDto>
}
```

### **4. Store Catalog - Catálogo da Loja (Frontend)**

**Responsabilidade**: Exibição de produtos para clientes finais.

**Entidades**:
```typescript
Product {
  id: Id
  name: string
  description: string
  salesPrice: number    // Preço de venda (diferente do Product Admin)
}
```

**Casos de Uso**:
- `FindProductUseCase`: Buscar produto específico
- `FindAllProductsUseCase`: Listar produtos disponíveis

**Facade Interface**:
```typescript
interface StoreCatalogFacadeInterface {
  find(input: FindStoreCatalogFacadeInputDto): Promise<FindStoreCatalogFacadeOutputDto>
  findAll(): Promise<FindAllStoreCatalogFacadeOutputDto>
}
```

### **5. Payment - Sistema de Pagamentos**

**Responsabilidade**: Processamento de transações financeiras.

**Entidades**:
```typescript
Transaction {
  id: Id
  amount: number
  orderId: string
  status: "pending" | "approved" | "declined"
  createdAt: Date
  updatedAt: Date
}
```

**Regras de Negócio**:
- Valores ≥ R$ 100,00: Aprovação automática
- Valores < R$ 100,00: Rejeição automática

**Casos de Uso**:
- `ProcessPaymentUseCase`: Processar pagamento

**Facade Interface**:
```typescript
interface PaymentFacadeInterface {
  process(input: PaymentFacadeInputDto): Promise<PaymentFacadeOutputDto>
}
```

### **6. Invoice - Sistema de Faturas**

**Responsabilidade**: Geração e consulta de faturas.

**Entidades**:
```typescript
Invoice {
  id: Id
  name: string
  document: string
  address: Address
  items: InvoiceItems[]
  createdAt: Date
  updatedAt: Date
}

InvoiceItems {
  id: Id
  name: string
  price: number
}
```

**Casos de Uso**:
- `GenerateInvoiceUseCase`: Gerar nova fatura
- `FindInvoiceUseCase`: Buscar fatura existente

**Facade Interface**:
```typescript
interface InvoiceFacadeInterface {
  generate(input: GenerateInvoiceFacadeInputDto): Promise<GenerateInvoiceFacadeOutputDto>
  find(input: FindInvoiceFacadeInputDto): Promise<FindInvoiceFacadeOutputDto>
}
```

### **7. Checkout - Processo de Pedidos**

**Responsabilidade**: Orquestração do processo de compra completo.

**Entidades**:
```typescript
Order {
  id: Id
  client: Client
  products: Product[]
  status: string
  total: number
}

Product {  // Específico do Checkout
  id: Id
  name: string
  description: string
  salesPrice: number
}

Client {   // Específico do Checkout
  id: Id
  name: string
  email: string
  address: string
}
```

**Casos de Uso**:
- `PlaceOrderUseCase`: Realizar pedido (principal orquestrador)

## 🔄 Comunicação Entre Módulos

### **Padrão Facade**

A comunicação entre módulos é realizada exclusivamente através de **Facades**, que funcionam como:

1. **Interface Externa**: Única forma de acessar funcionalidades do módulo
2. **Abstração**: Esconde a complexidade interna
3. **Desacoplamento**: Módulos não conhecem implementações uns dos outros

### **Exemplo de Integração no Checkout**

```typescript
export default class PlaceOrderUseCase implements UseCaseInterface {
  private _clientFacade: ClientAdmFacadeInterface;
  private _productFacade: ProductAdmFacadeInterface;
  private _catalogFacade: StoreCatalogFacadeInterface;

  async execute(input: PlaceOrderInputDto): Promise<PlaceOrderOutputDto> {
    // 1. Validar cliente através do Client Admin
    const client = await this._clientFacade.find({ id: input.clientId });
    
    // 2. Verificar estoque através do Product Admin
    await this.validateProducts(input);
    
    // 3. Obter informações de venda através do Store Catalog
    const products = await this.getProducts(input.products);
    
    // 4. Processar pedido...
  }
}
```

## 📊 Fluxos Principais de Negócio

### **🏗️ Visão Geral da Arquitetura Modular**

```
                              ┌─────────────────────────────────────────────────────────────┐
                              │                    FC MONOLITO ARCHITECTURE                 │
                              │                     Clean Architecture                      │
                              └─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                          🌐 PRESENTATION LAYER                                                  │ 
│                                                                                                                 │
│  ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐    │
│  │   Admin Panel   │   │  Customer App   │   │   Payment UI    │   │   Reports UI    │   │   Mobile App    │    │
│  │                 │   │                 │   │                 │   │                 │   │                 │    │
│  │ • Client Mgmt   │   │ • Catalog       │   │ • Transactions  │   │ • Invoices      │   │ • Orders        │    │
│  │ • Product Mgmt  │   │ • Cart          │   │ • Status        │   │ • Analytics     │   │ • Tracking      │    │
│  └─────────────────┘   └─────────────────┘   └─────────────────┘   └─────────────────┘   └─────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
                                                          │
                                                          ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                          🎯 FACADE LAYER                                                       │
│                                         (Module Interfaces)                                                    │
│                                                                                                                │
│ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌─────────────┐ │
│ │ Client Admin   │ │ Product Admin  │ │ Store Catalog  │ │    Payment     │ │    Invoice     │ │   Checkout  │ │
│ │    Facade      │ │    Facade      │ │    Facade      │ │    Facade      │ │    Facade      │ │   Facade    │ │
│ │                │ │                │ │                │ │                │ │                │ │             │ │
│ │ • add()        │ │ • addProduct() │ │ • find()       │ │ • process()    │ │ • generate()   │ │ • placeOrder│ │
│ │ • find()       │ │ • checkStock() │ │ • findAll()    │ │                │ │ • find()       │ │             │ │
│ └────────────────┘ └────────────────┘ └────────────────┘ └────────────────┘ └────────────────┘ └─────────────┘ │
│         │                   │                   │                   │                   │            │         │
│         │                   │                   │                   │                   │            │         │
│         │   ┌───────────────────────────────────────────────────────────────────────────────────────┐│         │
│         │   │                      CHECKOUT - MAIN ORCHESTRATOR                                     ││         │
│         │   │                                                                                       ││         │
│         │   │  • Coordinates all modules        • Manages complete workflow                        ││          │
│         │   │  • Validates business rules       • Controls transaction flow                        ││          │
│         │   └───────────────────────────────────────────────────────────────────────────────────────┘│         │
│         │                                              │                                              │        │
└─────────┼──────────────────────────────────────────────┼──────────────────────────────────────────────┼────────┘
            │                                           │
            ▼                                           ▼
┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                        🧠 USE CASE LAYER                                                      │
│                                       (Business Logic)                                                        │
│                                                                                                               │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │
│ │AddClientUse  │ │AddProductUse │ │FindProductUse│ │ProcessPayment│ │GenerateInvoice│ │PlaceOrderUse │        │
│ │FindClientUse │ │CheckStockUse │ │FindAllProd.. │ │UseCase       │ │FindInvoiceUse│ │Case          │         │
│ │              │ │              │ │              │ │              │ │              │ │              │         │
│ │ Business     │ │ Business     │ │ Business     │ │ Business     │ │ Business     │ │ Business     │         │
│ │ Rules        │ │ Rules        │ │ Rules        │ │ Rules        │ │ Rules        │ │ Rules        │         │
│ │ Validation   │ │ Validation   │ │ Validation   │ │ Validation   │ │ Validation   │ │ Validation   │         │
│ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘         │
│         │                 │                 │                 │                 │                 │           │
└─────────┼─────────────────┼─────────────────┼─────────────────┼─────────────────┼─────────────────┼───────────┘
            │                    │                    │                    │                    │
            ▼                    ▼                    ▼                    ▼                    ▼
┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                      💾 REPOSITORY LAYER                                                     │
│                                      (Data Access)                                                            │
│                                                                                                               │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │
│ │   Client     │ │   Product    │ │ Store Product│ │ Transaction  │ │   Invoice    │ │   Checkout   │         │
│ │ Repository   │ │ Repository   │ │ Repository   │ │ Repository   │ │ Repository   │ │ Repository   │         │
│ │              │ │              │ │              │ │              │ │              │ │              │         │
│ │ • save()     │ │ • save()     │ │ • findAll()  │ │ • save()     │ │ • save()     │ │ • save()     │         │
│ │ • findById() │ │ • findById() │ │ • findById() │ │ • findById() │ │ • findById() │ │ • findById() │         │
│ │ • update()   │ │ • update()   │ │ • search()   │ │ • update()   │ │ • findByDate │ │ • findByDate │         │
│ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘         │
│         │                 │                 │                 │                 │                 │           │
└─────────┼─────────────────┼─────────────────┼─────────────────┼─────────────────┼─────────────────┼───────────┘
            │                    │                    │                    │                    │
            ▼                    ▼                    ▼                    ▼                    ▼
┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       🗃️ DATABASE LAYER                                                      │
│                                                                                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   clients   │  │  products   │  │store_catalog│  │transactions │  │  invoices   │  │   orders    │         │
│  │             │  │             │  │             │  │             │  │             │  │             │         │
│  │ • id        │  │ • id        │  │ • id        │  │ • id        │  │ • id        │  │ • id        │         │
│  │ • name      │  │ • name      │  │ • name      │  │ • orderId   │  │ • name      │  │ • clientId  │         │
│  │ • email     │  │ • description│ │ • description│ │ • amount    │  │ • document  │  │ • status    │         │
│  │ • document  │  │ • purchase  │  │ • salesPrice│  │ • status    │  │ • address   │  │ • total     │         │
│  │ • address   │  │   Price     │  │             │  │ • createdAt │  │ • total     │  │ • paymentId │         │
│  │ • createdAt │  │ • stock     │  │             │  │             │  │ • createdAt │  │ • invoiceId │         │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                                               │                               │
│                                                                               ▼                               │
│                                                                    ┌─────────────┐                            │
│                                                                    │invoice_items│                            │
│                                                                    │             │                            │
│                                                                    │ • id        │                            │
│                                                                    │ • invoiceId │                            │
│                                                                    │ • name      │                            │
│                                                                    │ • price     │                            │
│                                                                    └─────────────┘                            │
└───────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
│                                                                                                               │
└───────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

                              ┌─────────────────────────────────────────────────────────────┐
                              │                    🔗 RELATIONSHIPS                        │
                              │                                                             │
                              │  Client Admin    ←──────────────→   Checkout                │
                              │  Product Admin   ←──────────────→   Checkout                │
                              │  Store Catalog   ←──────────────→   Checkout                │
                              │  Payment         ←──────────────→   Checkout                │
                              │  Invoice         ←──────────────→   Checkout                │
                              │                                                             │
                              │  All communication via FACADE PATTERN                       │
                              │  No direct dependencies between modules                     │
                              └─────────────────────────────────────────────────────────────┘
```

### **1. Fluxo de Cadastro de Cliente**

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────────────┐
│  Admin          │       │  Client Admin   │       │  Add Client             │
│  Interface      │─────▶│  Facade         │──────▶│  Use Case               │
│                 │       │                 │       │                         │
│ • Form Data     │       │ • Input         │       │ • Business Rules        │
│ • Validation    │       │   Validation    │       │ • Data Transformation   │
│ • User Request  │       │ • DTO Mapping   │       │ • Entity Creation       │
└─────────────────┘       └─────────────────┘       └─────────────────────────┘
                                                                  │
                                                                  ▼
                                                    ┌─────────────────────────┐
                                                    │  Client                 │
                                                    │  Repository             │
                                                    │                         │
                                                    │ • save(client)          │
                                                    │ • generate ID           │
                                                    │ • validate uniqueness   │
                                                    └─────────────────────────┘
                                                                  │
                                                                  ▼
                                                    ┌─────────────────────────┐
                                                    │      Database           │
                                                    │                         │
                                                    │ clients table:          │
                                                    │ • id (UUID)             │
                                                    │ • name                  │
                                                    │ • email (unique)        │
                                                    │ • document              │
                                                    │ • street                │
                                                    │ • number                │
                                                    │ • complement            │
                                                    │ • city                  │
                                                    │ • state                 │
                                                    │ • zipCode               │
                                                    │ • createdAt             │
                                                    │ • updatedAt             │
                                                    └─────────────────────────┘
```

**Passos**:
1. Recebe dados do cliente via interface administrativa
2. Client Admin Facade valida e delega para Add Client Use Case
3. Use Case aplica regras de negócio
4. Repository persiste no banco de dados

### **2. Fluxo de Cadastro de Produto**

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────────────┐
│  Admin          │       │  Product Admin  │       │  Add Product            │
│  Interface      │──────▶│  Facade         │──────▶│  Use Case              │
│                 │       │                 │       │                         │
│ • Product Form  │       │ • Input         │       │ • Validation Rules      │
│ • Price Info    │       │   Validation    │       │ • Stock Validation      │
│ • Stock Data    │       │ • DTO Mapping   │       │ • Price Validation      │
└─────────────────┘       └─────────────────┘       └─────────────────────────┘
                                                                  │
                                                                  ▼
                                                    ┌─────────────────────────┐
                                                    │  Product                │
                                                    │  Repository             │
                                                    │                         │
                                                    │ • save(product)         │
                                                    │ • generate ID           │
                                                    │ • validate data         │
                                                    └─────────────────────────┘
                                                                  │
                                                                  ▼
                                                    ┌─────────────────────────┐
                                                    │      Database           │
                                                    │                         │
                                                    │ products table:         │
                                                    │ • id (UUID)             │
                                                    │ • name                  │
                                                    │ • description           │
                                                    │ • purchasePrice         │
                                                    │ • stock (integer)       │
                                                    │ • createdAt             │
                                                    │ • updatedAt             │
                                                    └─────────────────────────┘
```

**Passos**:
1. Recebe dados do produto (nome, descrição, preço de compra, estoque)
2. Product Admin Facade valida entrada
3. Add Product Use Case executa validações de negócio
4. Product Repository salva no banco

### **3. Fluxo de Consulta de Catálogo**

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────────────┐
│  Customer       │       │  Store Catalog  │       │  Find Products          │
│  Interface      │──────▶│  Facade         │──────▶│  Use Case               │
│                 │       │                 │       │                         │
│ • Search Query  │       │ • Query         │       │ • Search Logic          │
│ • Filter Data   │       │   Processing    │       │ • Filter Application    │
│ • Page Request  │       │ • Response      │       │ • Pagination            │
└─────────────────┘       │   Formatting    │       └─────────────────────────┘
                          └─────────────────┘                       │
                                    ▲                               ▼
                                    │                 ┌─────────────────────────┐
                                    │                 │  Product                │
                                    │                 │  Repository             │
                                    │                 │                         │
                                    │                 │ • findAll()             │
                                    │                 │ • findById()            │
                                    │                 │ • apply filters         │
                                    │                 └─────────────────────────┘
                                    │                               │
                                    │                               ▼
                                    │                 ┌─────────────────────────┐
                                    │                 │      Database           │
                                    │                 │                         │
                                    │                 │ store_products table:   │
                                    │                 │ • id (UUID)             │
                                    │                 │ • name                  │
                                    │                 │ • description           │
                                    │                 │ • salesPrice            │
                                    │                 │ • createdAt             │
                                    │                 │ • updatedAt             │
                                    │                 └─────────────────────────┘
                                    │                               │
                                    │         ┌─────────────────────┘
                                    │         │
                                    │         ▼
                          ┌─────────────────────────┐
                          │     Response Data       │
                          │                         │
                          │ Products List:          │
                          │ • id                    │
                          │ • name                  │
                          │ • description           │
                          │ • salesPrice            │
                          │                         │
                          │ Formatted for UI        │
                          └─────────────────────────┘
```

**Passos**:
1. Cliente acessa catálogo de produtos
2. Store Catalog Facade processa requisição
3. Find Products Use Case busca produtos disponíveis
4. Repository consulta banco retornando produtos com preço de venda

### **4. Fluxo Completo de Pedido (Checkout)**

```
                              ┌─────────────────────────────────────────────────────────────┐
                              │                    CHECKOUT ORCHESTRATION                   │
                              └─────────────────────────────────────────────────────────────┘

┌─────────────────┐       ┌─────────────────┐       ┌─────────────────────────────────────┐
│  Customer       │       │  Checkout       │       │         Place Order                 │
│  Request        │──────▶│  Facade         │──────▶│         Use Case                   │
│                 │       │                 │       │                                     │
│ • clientId      │       │ • Validates     │       │    🎯 MAIN ORCHESTRATOR             │
│ • products[]    │       │ • Routes        │       │                                     │
│ • quantities    │       │ • Coordinates   │       │ Coordinates all modules:            │
└─────────────────┘       └─────────────────┘       └─────────────────────────────────────┘
                                                                        │
                    ┌───────────────────────────────────────────────────┼───────────────────────────────────────────────────┐
                    │                                                   │                                                   │
                    ▼                                                   │                                                   ▼
        ┌─────────────────────────┐                                     │                                   ┌─────────────────────────┐
        │    1. CLIENT            │                                     │                                   │    2. PRODUCT           │
        │    VALIDATION           │                                     │                                   │    VALIDATION           │
        └─────────────────────────┘                                     │                                   └─────────────────────────┘
                    │                                                   │                                                   │
                    ▼                                                   │                                                   ▼
        ┌─────────────────────────┐                                     │                                   ┌─────────────────────────┐
        │  Client Admin           │                                     │                                   │  Product Admin          │
        │  Facade                 │                                     │                                   │  Facade                 │
        │                         │                                     │                                   │                         │
        │ • find(clientId)        │                                     │                                   │ • checkStock(productId) │
        │ • validate existence    │                                     │                                   │ • validate availability │
        └─────────────────────────┘                                     │                                   └─────────────────────────┘
                    │                                                   │                                                   │
                    ▼                                                   │                                                   ▼
        ┌─────────────────────────┐                                     │                                   ┌─────────────────────────┐
        │    Find Client          │                                     │                                   │    Check Stock          │
        │    Use Case             │                                     │                                   │    Use Case             │
        │                         │                                     │                                   │                         │
        │ • business validation   │                                     │                                   │ • stock verification    │
        │ • return client data    │                                     │                                   │ • availability check    │
        └─────────────────────────┘                                     │                                   └─────────────────────────┘
                    │                                                   │                                                   │
                    │                                                   │                                                   │
                    └───────────────────────────────────────────────────┼───────────────────────────────────────────────────┘
                                                                        │
                                                                        ▼
                                                        ┌─────────────────────────┐
                                                        │    3. PRODUCT           │
                                                        │    INFORMATION          │
                                                        └─────────────────────────┘
                                                                        │
                                                                        ▼
                                                        ┌─────────────────────────┐
                                                        │  Store Catalog          │
                                                        │  Facade                 │
                                                        │                         │
                                                        │ • find(productId)       │
                                                        │ • get sales price       │
                                                        │ • product details       │
                                                        └─────────────────────────┘
                                                                        │
                                                                        ▼
                                                        ┌─────────────────────────┐
                                                        │    Find Product         │
                                                        │    Use Case             │
                                                        │                         │
                                                        │ • get product info      │
                                                        │ • pricing data          │
                                                        └─────────────────────────┘
                                                                        │
        ┌───────────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────┐
        │                                                               │                                                               │
        ▼                                                               │                                                               ▼
┌─────────────────────────┐                                             │                                             ┌─────────────────────────┐
│    4. PAYMENT           │                                             │                                             │    5. INVOICE           │
│    PROCESSING           │                                             │                                             │    GENERATION           │
└─────────────────────────┘                                             │                                             └─────────────────────────┘
            │                                                           │                                                             │
            ▼                                                           │                                                             ▼
┌─────────────────────────┐                                             │                                             ┌─────────────────────────┐
│  Payment                │                                             │                                             │  Invoice                │
│  Facade                 │                                             │                                             │  Facade                 │
│                         │                                             │                                             │                         │
│ • process(order)        │                                             │                                             │ • generate(data)        │
│ • amount validation     │                                             │                                             │ • client + items        │
└─────────────────────────┘                                             │                                             └─────────────────────────┘
            │                                                           │                                                             │
            ▼                                                           │                                                             ▼
┌─────────────────────────┐                                             │                                             ┌─────────────────────────┐
│    Process Payment      │                                             │                                             │    Generate Invoice     │
│    Use Case             │                                             │                                             │    Use Case             │
│                         │                                             │                                             │                         │
│ • amount >= 100?        │                                             │                                             │ • create invoice        │
│ • approve/decline       │                                             │                                             │ • calculate total       │
└─────────────────────────┘                                             │                                             └─────────────────────────┘
            │                                                           │                                                             │
            │                                                           │                                                             │
            └───────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────┘
                                                                        │
                                                                        ▼
                                                        ┌─────────────────────────┐
                                                        │    6. ORDER             │
                                                        │    PERSISTENCE          │
                                                        └─────────────────────────┘
                                                                        │
                                                                        ▼
                                                        ┌─────────────────────────┐
                                                        │  Checkout               │
                                                        │  Repository             │
                                                        │                         │
                                                        │ • save(order)           │
                                                        │ • link all data         │
                                                        └─────────────────────────┘
                                                                        │
                                                                        ▼
                                                        ┌─────────────────────────┐
                                                        │      Database           │
                                                        │                         │
                                                        │ orders table:           │
                                                        │ • id                    │
                                                        │ • clientId              │
                                                        │ • products[]            │
                                                        │ • status                │
                                                        │ • total                 │
                                                        │ • paymentId             │
                                                        │ • invoiceId             │
                                                        │ • createdAt             │
                                                        └─────────────────────────┘
```

**Passos Detalhados**:

1. **Validação do Cliente**:
   ```typescript
   const client = await this._clientFacade.find({ id: input.clientId });
   if (!client) throw new Error("Client not found");
   ```

2. **Verificação de Estoque**:
   ```typescript
   for (const p of input.products) {
     const product = await this._productFacade.checkStock({ productId: p.productId });
     if (product.stock <= 0) throw new Error(`Product ${product.productId} is out of stock`);
   }
   ```

3. **Obtenção de Informações de Produto**:
   ```typescript
   const product = await this._catalogFacade.find({ id: productId });
   return new Product({
     id: new Id(product.id),
     name: product.name,
     description: product.description,
     salesPrice: product.salesPrice,
   });
   ```

4. **Processamento de Pagamento**:
   ```typescript
   const paymentResult = await this._paymentFacade.process({
     orderId: order.id,
     amount: order.total
   });
   ```

5. **Geração de Fatura**:
   ```typescript
   const invoice = await this._invoiceFacade.generate({
     name: client.name,
     document: client.document,
     // ... address data
     items: order.products.map(p => ({
       id: p.id,
       name: p.name,
       price: p.salesPrice
     }))
   });
   ```

### **5. Fluxo de Processamento de Pagamento**

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────────────┐
│  Payment        │       │  Payment        │       │  Process Payment        │
│  Request        │─────▶│  Facade         │──────▶│  Use Case               │
│                 │       │                 │       │                         │
│ • orderId       │       │ • Validates     │       │ • Business Logic        │
│ • amount        │       │ • Routes        │       │ • Amount Validation     │
└─────────────────┘       └─────────────────┘       └─────────────────────────┘
                                                                  │
                                                                  ▼
                                                    ┌─────────────────────────┐
                                                    │     Decision Point      │
                                                    │                         │
                                                    │   Amount >= R$ 100?     │
                                                    │                         │
                                                    └─────────────────────────┘
                                                              │
                                ┌─────────────────────────────┼─────────────────────────────┐
                                │                             │                             │
                                ▼                             ▼                             │
                  ┌─────────────────────────┐   ┌─────────────────────────┐                 │
                  │    Approve              │   │    Decline              │                 │
                  │    Transaction          │   │    Transaction          │                 │
                  │                         │   │                         │                 │
                  │ • status = "approved"   │   │ • status = "declined"   │                 │
                  │ • amount >= 100         │   │ • amount < 100          │                 │
                  └─────────────────────────┘   └─────────────────────────┘                 │
                                │                             │                             │
                                └─────────────────────────────┼─────────────────────────────┘
                                                              │
                                                              ▼
                                                ┌─────────────────────────┐
                                                │  Transaction            │
                                                │  Repository             │
                                                │                         │
                                                │ • save(transaction)     │
                                                │ • update status         │
                                                │ • persist data          │
                                                └─────────────────────────┘
                                                              │
                                                              ▼
                                                ┌─────────────────────────┐
                                                │      Database           │
                                                │                         │
                                                │ transactions table:     │
                                                │ • id                    │
                                                │ • orderId               │
                                                │ • amount                │
                                                │ • status                │
                                                │ • createdAt             │
                                                │ • updatedAt             │
                                                └─────────────────────────┘
```

**Regras**:
- Valores ≥ R$ 100,00: Aprovação automática
- Valores < R$ 100,00: Rejeição automática
- Status: "pending" → "approved" | "declined"

### **6. Fluxo de Geração de Fatura**

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────────────┐
│  Invoice        │       │  Invoice        │       │  Generate Invoice       │
│  Request        │─────▶│  Facade         │──────▶│  Use Case               │
│                 │       │                 │       │                         │
│ • name          │       │ • Input         │       │ • Business Logic        │
│ • document      │       │   Validation    │       │ • Address Composition   │
│ • address       │       │ • DTO Mapping   │       │ • Items Processing      │
│ • items[]       │       │ • Orchestration │       │ • Total Calculation     │
└─────────────────┘       └─────────────────┘       └─────────────────────────┘
                                                                  │
                                                                  ▼
                                                    ┌─────────────────────────┐
                                                    │     Entity Creation     │
                                                    │                         │
                                                    │ Invoice Entity:         │
                                                    │ • generate ID           │
                                                    │ • validate data         │
                                                    │ • create address        │
                                                    │ • process items         │
                                                    │ • calculate total       │
                                                    └─────────────────────────┘
                                                                  │
                                                                  ▼
                                                    ┌─────────────────────────┐
                                                    │  Invoice                │
                                                    │  Repository             │
                                                    │                         │
                                                    │ • save(invoice)         │
                                                    │ • save(invoiceItems)    │
                                                    │ • handle transaction    │
                                                    └─────────────────────────┘
                                                                  │
                                                                  ▼
                                    ┌─────────────────────────────────────────────────────────┐
                                    │                     Database                            │
                                    │                                                         │
                                    │  invoices table:              invoice_items table:      │
                                    │  • id (UUID)                  • id (UUID)               │
                                    │  • name                       • invoiceId (FK)          │
                                    │  • document                   • name                    │
                                    │  • street                     • price                   │
                                    │  • number                     • createdAt               │
                                    │  • complement                 • updatedAt               │
                                    │  • city                                                 │
                                    │  • state                      Relationship:             │
                                    │  • zipCode                    invoices (1) ──── (N)     │
                                    │  • createdAt                              invoice_items │
                                    │  • updatedAt                                            │
                                    └─────────────────────────────────────────────────────────┘
                                                                  │
                                                                  ▼
                                                    ┌─────────────────────────┐
                                                    │     Response            │
                                                    │                         │
                                                    │ Generated Invoice:      │
                                                    │ • invoiceId (UUID)      │
                                                    │ • total amount          │
                                                    │ • creation timestamp    │
                                                    │ • success status        │
                                                    └─────────────────────────┘
```

**Componentes**:
- Dados do cliente (nome, documento, endereço)
- Lista de itens com preços
- Cálculo automático do total
- Persistência com relacionamento Invoice → InvoiceItems

## 🏭 Padrão Factory

Cada módulo utiliza o padrão Factory para injeção de dependências:

```typescript
export default class ClientAdmFacadeFactory {
  static create() {
    const repository = new ClientRepository();
    const findUsecase = new FindClientUseCase(repository);
    const addUsecase = new AddClientUseCase(repository);
    
    const facade = new ClientAdmFacade({
      addUsecase: addUsecase,
      findUsecase: findUsecase,
    });

    return facade;
  }
}
```

## 🔍 Vantagens da Arquitetura

### **1. Separação de Responsabilidades**
- Cada módulo tem uma responsabilidade específica e bem definida
- Product Admin vs Store Catalog: diferentes contextos do mesmo produto

### **2. Baixo Acoplamento**
- Módulos comunicam-se apenas via Facades
- Não há dependências diretas entre implementações

### **3. Testabilidade**
- Cada camada pode ser testada independentemente
- Mocks facilmente implementados via interfaces

### **4. Escalabilidade**
- Novos módulos podem ser adicionados sem impactar existentes
- Facilita evolução para microserviços no futuro

### **5. Manutenibilidade**
- Código organizado e previsível
- Fácil localização de responsabilidades

## 🚀 Pontos de Extensão

### **Novos Módulos**
Para adicionar um novo módulo, seguir o padrão:
1. Criar estrutura domain/usecase/repository/facade/factory
2. Implementar interfaces de Gateway e Facade
3. Criar Factory para injeção de dependências
4. Integrar via Facade nos módulos que necessitarem

### **Evolução para Microserviços**
A arquitetura atual facilita a evolução:
- Cada módulo pode se tornar um microserviço
- Facades podem evoluir para HTTP clients
- Contratos bem definidos facilitam a transição

## 📚 Tecnologias e Ferramentas

- **Node.js 18+**: Runtime JavaScript
- **TypeScript**: Tipagem estática
- **Express.js**: Framework web
- **Sequelize**: ORM para banco de dados
- **SQLite**: Banco de dados (desenvolvimento)
- **Jest + SWC**: Testes automatizados
- **Docker**: Containerização

## 🎯 Conclusão

A arquitetura do FC Monolito demonstra como implementar um sistema monolítico modular robusto, seguindo as melhores práticas de Clean Architecture e DDD. A separação clara de responsabilidades, comunicação via Facades e organização em módulos independentes garantem um sistema maintível, testável e evolutivo.
