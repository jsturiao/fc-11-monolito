# Guia de Implementação - Módulo Invoice

## 📋 Visão Geral

Este documento detalha como implementar o módulo **Invoice** (Nota Fiscal) seguindo os padrões arquiteturais estabelecidos no projeto FC Monolito. O módulo seguirá os princípios de **Clean Architecture**, **DDD** e **SOLID** já implementados nos outros módulos.

## 🎯 Objetivos

Criar um módulo completo de Invoice com:
- ✅ **Use Cases**: `FindInvoiceUseCase` e `GenerateInvoiceUseCase`
- ✅ **Entidades**: `Invoice` e `InvoiceItems` 
- ✅ **Repository Pattern**: Persistência de dados
- ✅ **Facade Pattern**: Interface pública do módulo
- ✅ **Factory Pattern**: Criação de dependências
- ✅ **Testes**: Cobertura completa (unitários, integração, facade)

## 📁 Estrutura a ser Criada

```
src/modules/invoice/
├── domain/
│   ├── invoice.entity.ts
│   └── invoice-items.entity.ts
├── usecase/
│   ├── find-invoice/
│   │   ├── find-invoice.usecase.ts
│   │   ├── find-invoice.usecase.spec.ts
│   │   └── find-invoice.dto.ts
│   └── generate-invoice/
│       ├── generate-invoice.usecase.ts
│       ├── generate-invoice.usecase.spec.ts
│       └── generate-invoice.dto.ts
├── gateway/
│   └── invoice.gateway.ts
├── repository/
│   ├── invoice.model.ts
│   ├── invoice-items.model.ts
│   ├── invoice.repository.ts
│   └── invoice.repository.spec.ts
├── facade/
│   ├── invoice.facade.ts
│   ├── invoice.facade.spec.ts
│   └── invoice.facade.interface.ts
└── factory/
    └── invoice.facade.factory.ts
```

## 🚀 Passo a Passo da Implementação

### **Passo 1: Criar Estrutura de Diretórios**

```bash
# Criar diretório principal
mkdir src/modules/invoice

# Criar subdiretórios
mkdir src/modules/invoice/domain
mkdir src/modules/invoice/usecase
mkdir src/modules/invoice/usecase/find-invoice
mkdir src/modules/invoice/usecase/generate-invoice
mkdir src/modules/invoice/gateway
mkdir src/modules/invoice/repository
mkdir src/modules/invoice/facade
mkdir src/modules/invoice/factory
```

### **Passo 2: Implementar Entidades de Domínio**

#### **2.1. InvoiceItems Entity** (`src/modules/invoice/domain/invoice-items.entity.ts`)

```typescript
import AggregateRoot from "../../@shared/domain/entity/aggregate-root.interface";
import BaseEntity from "../../@shared/domain/entity/base.entity";
import Id from "../../@shared/domain/value-object/id.value-object";

type InvoiceItemsProps = {
  id?: Id;
  name: string;
  price: number;
};

export default class InvoiceItems extends BaseEntity implements AggregateRoot {
  private _name: string;
  private _price: number;

  constructor(props: InvoiceItemsProps) {
    super(props.id);
    this._name = props.name;
    this._price = props.price;
    this.validate();
  }

  validate(): void {
    if (this._name.length === 0) {
      throw new Error("Name is required");
    }
    if (this._price <= 0) {
      throw new Error("Price must be greater than 0");
    }
  }

  get name(): string {
    return this._name;
  }

  get price(): number {
    return this._price;
  }
}
```

#### **2.2. Invoice Entity** (`src/modules/invoice/domain/invoice.entity.ts`)

```typescript
import AggregateRoot from "../../@shared/domain/entity/aggregate-root.interface";
import BaseEntity from "../../@shared/domain/entity/base.entity";
import Address from "../../@shared/domain/value-object/address";
import Id from "../../@shared/domain/value-object/id.value-object";
import InvoiceItems from "./invoice-items.entity";

type InvoiceProps = {
  id?: Id;
  name: string;
  document: string;
  address: Address;
  items: InvoiceItems[];
  createdAt?: Date;
  updatedAt?: Date;
};

export default class Invoice extends BaseEntity implements AggregateRoot {
  private _name: string;
  private _document: string;
  private _address: Address;
  private _items: InvoiceItems[];

  constructor(props: InvoiceProps) {
    super(props.id, props.createdAt, props.updatedAt);
    this._name = props.name;
    this._document = props.document;
    this._address = props.address;
    this._items = props.items;
    this.validate();
  }

  validate(): void {
    if (this._name.length === 0) {
      throw new Error("Name is required");
    }
    if (this._document.length === 0) {
      throw new Error("Document is required");
    }
    if (this._items.length === 0) {
      throw new Error("Invoice must have at least one item");
    }
  }

  get name(): string {
    return this._name;
  }

  get document(): string {
    return this._document;
  }

  get address(): Address {
    return this._address;
  }

  get items(): InvoiceItems[] {
    return this._items;
  }

  total(): number {
    return this._items.reduce((total, item) => total + item.price, 0);
  }
}
```

### **Passo 3: Criar DTOs dos Use Cases**

#### **3.1. Find Invoice DTO** (`src/modules/invoice/usecase/find-invoice/find-invoice.dto.ts`)

```typescript
export interface FindInvoiceUseCaseInputDTO {
  id: string;
}

export interface FindInvoiceUseCaseOutputDTO {
  id: string;
  name: string;
  document: string;
  address: {
    street: string;
    number: string;
    complement: string;
    city: string;
    state: string;
    zipCode: string;
  };
  items: {
    id: string;
    name: string;
    price: number;
  }[];
  total: number;
  createdAt: Date;
}
```

#### **3.2. Generate Invoice DTO** (`src/modules/invoice/usecase/generate-invoice/generate-invoice.dto.ts`)

```typescript
export interface GenerateInvoiceUseCaseInputDto {
  name: string;
  document: string;
  street: string;
  number: string;
  complement: string;
  city: string;
  state: string;
  zipCode: string;
  items: {
    id: string;
    name: string;
    price: number;
  }[];
}

export interface GenerateInvoiceUseCaseOutputDto {
  id: string;
  name: string;
  document: string;
  street: string;
  number: string;
  complement: string;
  city: string;
  state: string;
  zipCode: string;
  items: {
    id: string;
    name: string;
    price: number;
  }[];
  total: number;
}
```

### **Passo 4: Implementar Gateway**

#### **4.1. Invoice Gateway** (`src/modules/invoice/gateway/invoice.gateway.ts`)

```typescript
import Invoice from "../domain/invoice.entity";

export default interface InvoiceGateway {
  generate(invoice: Invoice): Promise<Invoice>;
  find(id: string): Promise<Invoice>;
}
```

### **Passo 5: Implementar Models do Banco de Dados**

#### **5.1. InvoiceItems Model** (`src/modules/invoice/repository/invoice-items.model.ts`)

```typescript
import { Column, Model, PrimaryKey, Table, ForeignKey, BelongsTo } from "sequelize-typescript";
import InvoiceModel from "./invoice.model";

@Table({
  tableName: "invoice_items",
  timestamps: false,
})
export default class InvoiceItemsModel extends Model {
  @PrimaryKey
  @Column({ allowNull: false })
  id: string;

  @ForeignKey(() => InvoiceModel)
  @Column({ allowNull: false })
  invoice_id: string;

  @BelongsTo(() => InvoiceModel)
  invoice: InvoiceModel;

  @Column({ allowNull: false })
  name: string;

  @Column({ allowNull: false })
  price: number;
}
```

#### **5.2. Invoice Model** (`src/modules/invoice/repository/invoice.model.ts`)

```typescript
import { Column, Model, PrimaryKey, Table, HasMany } from "sequelize-typescript";
import InvoiceItemsModel from "./invoice-items.model";

@Table({
  tableName: "invoices",
  timestamps: false,
})
export default class InvoiceModel extends Model {
  @PrimaryKey
  @Column({ allowNull: false })
  id: string;

  @Column({ allowNull: false })
  name: string;

  @Column({ allowNull: false })
  document: string;

  @Column({ allowNull: false })
  street: string;

  @Column({ allowNull: false })
  number: string;

  @Column({ allowNull: false })
  complement: string;

  @Column({ allowNull: false })
  city: string;

  @Column({ allowNull: false })
  state: string;

  @Column({ allowNull: false, field: "zip_code" })
  zipCode: string;

  @Column({ allowNull: false, field: "created_at" })
  createdAt: Date;

  @Column({ allowNull: false, field: "updated_at" })
  updatedAt: Date;

  @HasMany(() => InvoiceItemsModel)
  items: InvoiceItemsModel[];
}
```

### **Passo 6: Implementar Repository**

#### **6.1. Invoice Repository** (`src/modules/invoice/repository/invoice.repository.ts`)

```typescript
import Address from "../../@shared/domain/value-object/address";
import Id from "../../@shared/domain/value-object/id.value-object";
import Invoice from "../domain/invoice.entity";
import InvoiceItems from "../domain/invoice-items.entity";
import InvoiceGateway from "../gateway/invoice.gateway";
import InvoiceItemsModel from "./invoice-items.model";
import InvoiceModel from "./invoice.model";

export default class InvoiceRepository implements InvoiceGateway {
  async generate(invoice: Invoice): Promise<Invoice> {
    await InvoiceModel.create(
      {
        id: invoice.id.id,
        name: invoice.name,
        document: invoice.document,
        street: invoice.address.street,
        number: invoice.address.number,
        complement: invoice.address.complement,
        city: invoice.address.city,
        state: invoice.address.state,
        zipCode: invoice.address.zipCode,
        createdAt: invoice.createdAt,
        updatedAt: invoice.updatedAt,
        items: invoice.items.map((item) => ({
          id: item.id.id,
          name: item.name,
          price: item.price,
        })),
      },
      {
        include: [{ model: InvoiceItemsModel }],
      }
    );

    return invoice;
  }

  async find(id: string): Promise<Invoice> {
    const invoice = await InvoiceModel.findOne({
      where: { id },
      include: [{ model: InvoiceItemsModel }],
    });

    if (!invoice) {
      throw new Error(`Invoice with id ${id} not found`);
    }

    const items = invoice.items.map(
      (item) =>
        new InvoiceItems({
          id: new Id(item.id),
          name: item.name,
          price: item.price,
        })
    );

    return new Invoice({
      id: new Id(invoice.id),
      name: invoice.name,
      document: invoice.document,
      address: new Address(
        invoice.street,
        invoice.number,
        invoice.complement,
        invoice.city,
        invoice.state,
        invoice.zipCode
      ),
      items: items,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
    });
  }
}
```

### **Passo 7: Implementar Use Cases**

#### **7.1. Find Invoice Use Case** (`src/modules/invoice/usecase/find-invoice/find-invoice.usecase.ts`)

```typescript
import InvoiceGateway from "../../gateway/invoice.gateway";
import { FindInvoiceUseCaseInputDTO, FindInvoiceUseCaseOutputDTO } from "./find-invoice.dto";

export default class FindInvoiceUseCase {
  constructor(private invoiceRepository: InvoiceGateway) {}

  async execute(input: FindInvoiceUseCaseInputDTO): Promise<FindInvoiceUseCaseOutputDTO> {
    const invoice = await this.invoiceRepository.find(input.id);

    return {
      id: invoice.id.id,
      name: invoice.name,
      document: invoice.document,
      address: {
        street: invoice.address.street,
        number: invoice.address.number,
        complement: invoice.address.complement,
        city: invoice.address.city,
        state: invoice.address.state,
        zipCode: invoice.address.zipCode,
      },
      items: invoice.items.map((item) => ({
        id: item.id.id,
        name: item.name,
        price: item.price,
      })),
      total: invoice.total(),
      createdAt: invoice.createdAt,
    };
  }
}
```

#### **7.2. Generate Invoice Use Case** (`src/modules/invoice/usecase/generate-invoice/generate-invoice.usecase.ts`)

```typescript
import Address from "../../../@shared/domain/value-object/address";
import Id from "../../../@shared/domain/value-object/id.value-object";
import Invoice from "../../domain/invoice.entity";
import InvoiceItems from "../../domain/invoice-items.entity";
import InvoiceGateway from "../../gateway/invoice.gateway";
import { GenerateInvoiceUseCaseInputDto, GenerateInvoiceUseCaseOutputDto } from "./generate-invoice.dto";

export default class GenerateInvoiceUseCase {
  constructor(private invoiceRepository: InvoiceGateway) {}

  async execute(input: GenerateInvoiceUseCaseInputDto): Promise<GenerateInvoiceUseCaseOutputDto> {
    const items = input.items.map(
      (item) =>
        new InvoiceItems({
          id: new Id(item.id),
          name: item.name,
          price: item.price,
        })
    );

    const invoice = new Invoice({
      name: input.name,
      document: input.document,
      address: new Address(
        input.street,
        input.number,
        input.complement,
        input.city,
        input.state,
        input.zipCode
      ),
      items: items,
    });

    const result = await this.invoiceRepository.generate(invoice);

    return {
      id: result.id.id,
      name: result.name,
      document: result.document,
      street: result.address.street,
      number: result.address.number,
      complement: result.address.complement,
      city: result.address.city,
      state: result.address.state,
      zipCode: result.address.zipCode,
      items: result.items.map((item) => ({
        id: item.id.id,
        name: item.name,
        price: item.price,
      })),
      total: result.total(),
    };
  }
}
```

### **Passo 8: Implementar Facade**

#### **8.1. Invoice Facade Interface** (`src/modules/invoice/facade/invoice.facade.interface.ts`)

```typescript
export interface GenerateInvoiceFacadeInputDto {
  name: string;
  document: string;
  street: string;
  number: string;
  complement: string;
  city: string;
  state: string;
  zipCode: string;
  items: {
    id: string;
    name: string;
    price: number;
  }[];
}

export interface GenerateInvoiceFacadeOutputDto {
  id: string;
  name: string;
  document: string;
  street: string;
  number: string;
  complement: string;
  city: string;
  state: string;
  zipCode: string;
  items: {
    id: string;
    name: string;
    price: number;
  }[];
  total: number;
}

export interface FindInvoiceFacadeInputDto {
  id: string;
}

export interface FindInvoiceFacadeOutputDto {
  id: string;
  name: string;
  document: string;
  address: {
    street: string;
    number: string;
    complement: string;
    city: string;
    state: string;
    zipCode: string;
  };
  items: {
    id: string;
    name: string;
    price: number;
  }[];
  total: number;
  createdAt: Date;
}

export default interface InvoiceFacadeInterface {
  generate(input: GenerateInvoiceFacadeInputDto): Promise<GenerateInvoiceFacadeOutputDto>;
  find(input: FindInvoiceFacadeInputDto): Promise<FindInvoiceFacadeOutputDto>;
}
```

#### **8.2. Invoice Facade** (`src/modules/invoice/facade/invoice.facade.ts`)

```typescript
import UseCaseInterface from "../../@shared/usecase/use-case.interface";
import InvoiceFacadeInterface, {
  FindInvoiceFacadeInputDto,
  FindInvoiceFacadeOutputDto,
  GenerateInvoiceFacadeInputDto,
  GenerateInvoiceFacadeOutputDto,
} from "./invoice.facade.interface";

export interface UseCaseProps {
  generateUseCase: UseCaseInterface;
  findUseCase: UseCaseInterface;
}

export default class InvoiceFacade implements InvoiceFacadeInterface {
  private _generateUseCase: UseCaseInterface;
  private _findUseCase: UseCaseInterface;

  constructor(useCaseProps: UseCaseProps) {
    this._generateUseCase = useCaseProps.generateUseCase;
    this._findUseCase = useCaseProps.findUseCase;
  }

  async generate(input: GenerateInvoiceFacadeInputDto): Promise<GenerateInvoiceFacadeOutputDto> {
    return await this._generateUseCase.execute(input);
  }

  async find(input: FindInvoiceFacadeInputDto): Promise<FindInvoiceFacadeOutputDto> {
    return await this._findUseCase.execute(input);
  }
}
```

### **Passo 9: Implementar Factory**

#### **9.1. Invoice Facade Factory** (`src/modules/invoice/factory/invoice.facade.factory.ts`)

```typescript
import InvoiceFacade from "../facade/invoice.facade";
import InvoiceRepository from "../repository/invoice.repository";
import FindInvoiceUseCase from "../usecase/find-invoice/find-invoice.usecase";
import GenerateInvoiceUseCase from "../usecase/generate-invoice/generate-invoice.usecase";

export default class InvoiceFacadeFactory {
  static create(): InvoiceFacade {
    const repository = new InvoiceRepository();
    const generateUseCase = new GenerateInvoiceUseCase(repository);
    const findUseCase = new FindInvoiceUseCase(repository);

    const facade = new InvoiceFacade({
      generateUseCase: generateUseCase,
      findUseCase: findUseCase,
    });

    return facade;
  }
}
```

## 🧪 Implementação de Testes

### **Passo 10: Implementar Testes Unitários dos Use Cases**

#### **10.1. Teste do Find Invoice Use Case** (`src/modules/invoice/usecase/find-invoice/find-invoice.usecase.spec.ts`)

```typescript
import Address from "../../../@shared/domain/value-object/address";
import Id from "../../../@shared/domain/value-object/id.value-object";
import Invoice from "../../domain/invoice.entity";
import InvoiceItems from "../../domain/invoice-items.entity";
import FindInvoiceUseCase from "./find-invoice.usecase";

const item1 = new InvoiceItems({
  id: new Id("1"),
  name: "Item 1",
  price: 100,
});

const item2 = new InvoiceItems({
  id: new Id("2"),
  name: "Item 2",
  price: 200,
});

const invoice = new Invoice({
  id: new Id("1"),
  name: "John Doe",
  document: "123456789",
  address: new Address(
    "Rua 123",
    "99",
    "Casa Verde",
    "Criciúma",
    "SC",
    "88888-888"
  ),
  items: [item1, item2],
});

const MockRepository = () => {
  return {
    generate: jest.fn(),
    find: jest.fn().mockReturnValue(Promise.resolve(invoice)),
  };
};

describe("Find Invoice Use Case unit test", () => {
  it("should find an invoice", async () => {
    const repository = MockRepository();
    const usecase = new FindInvoiceUseCase(repository);

    const input = {
      id: "1",
    };

    const result = await usecase.execute(input);

    expect(repository.find).toHaveBeenCalled();
    expect(result.id).toEqual(invoice.id.id);
    expect(result.name).toEqual(invoice.name);
    expect(result.document).toEqual(invoice.document);
    expect(result.address.street).toEqual(invoice.address.street);
    expect(result.address.number).toEqual(invoice.address.number);
    expect(result.address.complement).toEqual(invoice.address.complement);
    expect(result.address.city).toEqual(invoice.address.city);
    expect(result.address.state).toEqual(invoice.address.state);
    expect(result.address.zipCode).toEqual(invoice.address.zipCode);
    expect(result.items.length).toBe(2);
    expect(result.items[0].id).toEqual(item1.id.id);
    expect(result.items[0].name).toEqual(item1.name);
    expect(result.items[0].price).toEqual(item1.price);
    expect(result.items[1].id).toEqual(item2.id.id);
    expect(result.items[1].name).toEqual(item2.name);
    expect(result.items[1].price).toEqual(item2.price);
    expect(result.total).toBe(300);
    expect(result.createdAt).toEqual(invoice.createdAt);
  });
});
```

#### **10.2. Teste do Generate Invoice Use Case** (`src/modules/invoice/usecase/generate-invoice/generate-invoice.usecase.spec.ts`)

```typescript
import GenerateInvoiceUseCase from "./generate-invoice.usecase";

const MockRepository = () => {
  return {
    generate: jest.fn().mockImplementation((invoice) => Promise.resolve(invoice)),
    find: jest.fn(),
  };
};

describe("Generate Invoice Use Case unit test", () => {
  it("should generate an invoice", async () => {
    const repository = MockRepository();
    const usecase = new GenerateInvoiceUseCase(repository);

    const input = {
      name: "John Doe",
      document: "123456789",
      street: "Rua 123",
      number: "99",
      complement: "Casa Verde",
      city: "Criciúma",
      state: "SC",
      zipCode: "88888-888",
      items: [
        {
          id: "1",
          name: "Item 1",
          price: 100,
        },
        {
          id: "2",
          name: "Item 2",
          price: 200,
        },
      ],
    };

    const result = await usecase.execute(input);

    expect(repository.generate).toHaveBeenCalled();
    expect(result.id).toBeDefined();
    expect(result.name).toEqual(input.name);
    expect(result.document).toEqual(input.document);
    expect(result.street).toEqual(input.street);
    expect(result.number).toEqual(input.number);
    expect(result.complement).toEqual(input.complement);
    expect(result.city).toEqual(input.city);
    expect(result.state).toEqual(input.state);
    expect(result.zipCode).toEqual(input.zipCode);
    expect(result.items.length).toBe(2);
    expect(result.items[0].id).toEqual(input.items[0].id);
    expect(result.items[0].name).toEqual(input.items[0].name);
    expect(result.items[0].price).toEqual(input.items[0].price);
    expect(result.items[1].id).toEqual(input.items[1].id);
    expect(result.items[1].name).toEqual(input.items[1].name);
    expect(result.items[1].price).toEqual(input.items[1].price);
    expect(result.total).toBe(300);
  });

  it("should throw error when name is empty", async () => {
    const repository = MockRepository();
    const usecase = new GenerateInvoiceUseCase(repository);

    const input = {
      name: "",
      document: "123456789",
      street: "Rua 123",
      number: "99",
      complement: "Casa Verde",
      city: "Criciúma",
      state: "SC",
      zipCode: "88888-888",
      items: [
        {
          id: "1",
          name: "Item 1",
          price: 100,
        },
      ],
    };

    await expect(usecase.execute(input)).rejects.toThrow("Name is required");
  });

  it("should throw error when items array is empty", async () => {
    const repository = MockRepository();
    const usecase = new GenerateInvoiceUseCase(repository);

    const input = {
      name: "John Doe",
      document: "123456789",
      street: "Rua 123",
      number: "99",
      complement: "Casa Verde",
      city: "Criciúma",
      state: "SC",
      zipCode: "88888-888",
      items: [],
    };

    await expect(usecase.execute(input)).rejects.toThrow("Invoice must have at least one item");
  });
});
```

### **Passo 11: Implementar Testes de Integração do Repository**

#### **11.1. Teste do Invoice Repository** (`src/modules/invoice/repository/invoice.repository.spec.ts`)

```typescript
import { Sequelize } from "sequelize-typescript";
import Address from "../../@shared/domain/value-object/address";
import Id from "../../@shared/domain/value-object/id.value-object";
import Invoice from "../domain/invoice.entity";
import InvoiceItems from "../domain/invoice-items.entity";
import InvoiceItemsModel from "./invoice-items.model";
import InvoiceModel from "./invoice.model";
import InvoiceRepository from "./invoice.repository";

describe("Invoice Repository test", () => {
  let sequelize: Sequelize;

  beforeEach(async () => {
    sequelize = new Sequelize({
      dialect: "sqlite",
      storage: ":memory:",
      logging: false,
      sync: { force: true },
    });

    await sequelize.addModels([InvoiceModel, InvoiceItemsModel]);
    await sequelize.sync();
  });

  afterEach(async () => {
    await sequelize.close();
  });

  it("should generate an invoice", async () => {
    const item1 = new InvoiceItems({
      id: new Id("1"),
      name: "Item 1",
      price: 100,
    });

    const item2 = new InvoiceItems({
      id: new Id("2"),
      name: "Item 2",
      price: 200,
    });

    const invoice = new Invoice({
      id: new Id("1"),
      name: "John Doe",
      document: "123456789",
      address: new Address(
        "Rua 123",
        "99",
        "Casa Verde",
        "Criciúma",
        "SC",
        "88888-888"
      ),
      items: [item1, item2],
    });

    const repository = new InvoiceRepository();
    const result = await repository.generate(invoice);

    expect(result.id.id).toEqual(invoice.id.id);
    expect(result.name).toEqual(invoice.name);
    expect(result.document).toEqual(invoice.document);

    // Verificar no banco de dados
    const invoiceDb = await InvoiceModel.findOne({
      where: { id: invoice.id.id },
      include: [{ model: InvoiceItemsModel }],
    });

    expect(invoiceDb).toBeDefined();
    expect(invoiceDb.id).toEqual(invoice.id.id);
    expect(invoiceDb.name).toEqual(invoice.name);
    expect(invoiceDb.document).toEqual(invoice.document);
    expect(invoiceDb.street).toEqual(invoice.address.street);
    expect(invoiceDb.number).toEqual(invoice.address.number);
    expect(invoiceDb.complement).toEqual(invoice.address.complement);
    expect(invoiceDb.city).toEqual(invoice.address.city);
    expect(invoiceDb.state).toEqual(invoice.address.state);
    expect(invoiceDb.zipCode).toEqual(invoice.address.zipCode);
    expect(invoiceDb.items.length).toBe(2);
    expect(invoiceDb.items[0].name).toEqual("Item 1");
    expect(invoiceDb.items[0].price).toBe(100);
    expect(invoiceDb.items[1].name).toEqual("Item 2");
    expect(invoiceDb.items[1].price).toBe(200);
  });

  it("should find an invoice", async () => {
    // Criar invoice no banco
    const invoiceDb = await InvoiceModel.create(
      {
        id: "1",
        name: "John Doe",
        document: "123456789",
        street: "Rua 123",
        number: "99",
        complement: "Casa Verde",
        city: "Criciúma",
        state: "SC",
        zipCode: "88888-888",
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [
          {
            id: "1",
            name: "Item 1",
            price: 100,
          },
          {
            id: "2",
            name: "Item 2",
            price: 200,
          },
        ],
      },
      {
        include: [{ model: InvoiceItemsModel }],
      }
    );

    const repository = new InvoiceRepository();
    const result = await repository.find("1");

    expect(result.id.id).toEqual("1");
    expect(result.name).toEqual("John Doe");
    expect(result.document).toEqual("123456789");
    expect(result.address.street).toEqual("Rua 123");
    expect(result.address.number).toEqual("99");
    expect(result.address.complement).toEqual("Casa Verde");
    expect(result.address.city).toEqual("Criciúma");
    expect(result.address.state).toEqual("SC");
    expect(result.address.zipCode).toEqual("88888-888");
    expect(result.items.length).toBe(2);
    expect(result.items[0].name).toEqual("Item 1");
    expect(result.items[0].price).toBe(100);
    expect(result.items[1].name).toEqual("Item 2");
    expect(result.items[1].price).toBe(200);
    expect(result.total()).toBe(300);
  });

  it("should throw error when invoice not found", async () => {
    const repository = new InvoiceRepository();

    await expect(repository.find("non-existent-id")).rejects.toThrow(
      "Invoice with id non-existent-id not found"
    );
  });
});
```

### **Passo 12: Implementar Testes da Facade**

#### **12.1. Teste da Invoice Facade** (`src/modules/invoice/facade/invoice.facade.spec.ts`)

```typescript
import { Sequelize } from "sequelize-typescript";
import InvoiceFacadeFactory from "../factory/invoice.facade.factory";
import InvoiceItemsModel from "../repository/invoice-items.model";
import InvoiceModel from "../repository/invoice.model";

describe("Invoice Facade test", () => {
  let sequelize: Sequelize;

  beforeEach(async () => {
    sequelize = new Sequelize({
      dialect: "sqlite",
      storage: ":memory:",
      logging: false,
      sync: { force: true },
    });

    await sequelize.addModels([InvoiceModel, InvoiceItemsModel]);
    await sequelize.sync();
  });

  afterEach(async () => {
    await sequelize.close();
  });

  it("should generate an invoice", async () => {
    const facade = InvoiceFacadeFactory.create();

    const input = {
      name: "John Doe",
      document: "123456789",
      street: "Rua 123",
      number: "99",
      complement: "Casa Verde",
      city: "Criciúma",
      state: "SC",
      zipCode: "88888-888",
      items: [
        {
          id: "1",
          name: "Item 1",
          price: 100,
        },
        {
          id: "2",
          name: "Item 2",
          price: 200,
        },
      ],
    };

    const output = await facade.generate(input);

    expect(output.id).toBeDefined();
    expect(output.name).toEqual(input.name);
    expect(output.document).toEqual(input.document);
    expect(output.street).toEqual(input.street);
    expect(output.number).toEqual(input.number);
    expect(output.complement).toEqual(input.complement);
    expect(output.city).toEqual(input.city);
    expect(output.state).toEqual(input.state);
    expect(output.zipCode).toEqual(input.zipCode);
    expect(output.items.length).toBe(2);
    expect(output.items[0].id).toEqual(input.items[0].id);
    expect(output.items[0].name).toEqual(input.items[0].name);
    expect(output.items[0].price).toEqual(input.items[0].price);
    expect(output.items[1].id).toEqual(input.items[1].id);
    expect(output.items[1].name).toEqual(input.items[1].name);
    expect(output.items[1].price).toEqual(input.items[1].price);
    expect(output.total).toBe(300);

    // Verificar se foi salvo no banco
    const invoiceDb = await InvoiceModel.findOne({
      where: { id: output.id },
      include: [{ model: InvoiceItemsModel }],
    });

    expect(invoiceDb).toBeDefined();
    expect(invoiceDb.name).toEqual(input.name);
    expect(invoiceDb.items.length).toBe(2);
  });

  it("should find an invoice", async () => {
    const facade = InvoiceFacadeFactory.create();

    // Primeiro gerar uma invoice
    const inputGenerate = {
      name: "John Doe",
      document: "123456789",
      street: "Rua 123",
      number: "99",
      complement: "Casa Verde",
      city: "Criciúma",
      state: "SC",
      zipCode: "88888-888",
      items: [
        {
          id: "1",
          name: "Item 1",
          price: 100,
        },
        {
          id: "2",
          name: "Item 2",
          price: 200,
        },
      ],
    };

    const outputGenerate = await facade.generate(inputGenerate);

    // Então buscar a invoice
    const inputFind = {
      id: outputGenerate.id,
    };

    const outputFind = await facade.find(inputFind);

    expect(outputFind.id).toEqual(outputGenerate.id);
    expect(outputFind.name).toEqual(inputGenerate.name);
    expect(outputFind.document).toEqual(inputGenerate.document);
    expect(outputFind.address.street).toEqual(inputGenerate.street);
    expect(outputFind.address.number).toEqual(inputGenerate.number);
    expect(outputFind.address.complement).toEqual(inputGenerate.complement);
    expect(outputFind.address.city).toEqual(inputGenerate.city);
    expect(outputFind.address.state).toEqual(inputGenerate.state);
    expect(outputFind.address.zipCode).toEqual(inputGenerate.zipCode);
    expect(outputFind.items.length).toBe(2);
    expect(outputFind.items[0].id).toEqual(inputGenerate.items[0].id);
    expect(outputFind.items[0].name).toEqual(inputGenerate.items[0].name);
    expect(outputFind.items[0].price).toEqual(inputGenerate.items[0].price);
    expect(outputFind.items[1].id).toEqual(inputGenerate.items[1].id);
    expect(outputFind.items[1].name).toEqual(inputGenerate.items[1].name);
    expect(outputFind.items[1].price).toEqual(inputGenerate.items[1].price);
    expect(outputFind.total).toBe(300);
    expect(outputFind.createdAt).toBeDefined();
  });
});
```

### **Passo 13: Testes das Entidades de Domínio**

#### **13.1. Teste da Invoice Entity** (`src/modules/invoice/domain/invoice.entity.spec.ts`)

```typescript
import Address from "../../@shared/domain/value-object/address";
import Id from "../../@shared/domain/value-object/id.value-object";
import Invoice from "./invoice.entity";
import InvoiceItems from "./invoice-items.entity";

describe("Invoice Entity unit test", () => {
  it("should create an invoice", () => {
    const item1 = new InvoiceItems({
      id: new Id("1"),
      name: "Item 1",
      price: 100,
    });

    const item2 = new InvoiceItems({
      id: new Id("2"),
      name: "Item 2",
      price: 200,
    });

    const invoice = new Invoice({
      id: new Id("1"),
      name: "John Doe",
      document: "123456789",
      address: new Address(
        "Rua 123",
        "99",
        "Casa Verde",
        "Criciúma",
        "SC",
        "88888-888"
      ),
      items: [item1, item2],
    });

    expect(invoice.id.id).toEqual("1");
    expect(invoice.name).toEqual("John Doe");
    expect(invoice.document).toEqual("123456789");
    expect(invoice.address.street).toEqual("Rua 123");
    expect(invoice.items.length).toBe(2);
    expect(invoice.total()).toBe(300);
  });

  it("should throw error when name is empty", () => {
    const item = new InvoiceItems({
      id: new Id("1"),
      name: "Item 1",
      price: 100,
    });

    expect(() => {
      new Invoice({
        id: new Id("1"),
        name: "",
        document: "123456789",
        address: new Address(
          "Rua 123",
          "99",
          "Casa Verde",
          "Criciúma",
          "SC",
          "88888-888"
        ),
        items: [item],
      });
    }).toThrow("Name is required");
  });

  it("should throw error when document is empty", () => {
    const item = new InvoiceItems({
      id: new Id("1"),
      name: "Item 1",
      price: 100,
    });

    expect(() => {
      new Invoice({
        id: new Id("1"),
        name: "John Doe",
        document: "",
        address: new Address(
          "Rua 123",
          "99",
          "Casa Verde",
          "Criciúma",
          "SC",
          "88888-888"
        ),
        items: [item],
      });
    }).toThrow("Document is required");
  });

  it("should throw error when items array is empty", () => {
    expect(() => {
      new Invoice({
        id: new Id("1"),
        name: "John Doe",
        document: "123456789",
        address: new Address(
          "Rua 123",
          "99",
          "Casa Verde",
          "Criciúma",
          "SC",
          "88888-888"
        ),
        items: [],
      });
    }).toThrow("Invoice must have at least one item");
  });
});
```

#### **13.2. Teste da InvoiceItems Entity** (`src/modules/invoice/domain/invoice-items.entity.spec.ts`)

```typescript
import Id from "../../@shared/domain/value-object/id.value-object";
import InvoiceItems from "./invoice-items.entity";

describe("InvoiceItems Entity unit test", () => {
  it("should create an invoice item", () => {
    const item = new InvoiceItems({
      id: new Id("1"),
      name: "Item 1",
      price: 100,
    });

    expect(item.id.id).toEqual("1");
    expect(item.name).toEqual("Item 1");
    expect(item.price).toBe(100);
  });

  it("should throw error when name is empty", () => {
    expect(() => {
      new InvoiceItems({
        id: new Id("1"),
        name: "",
        price: 100,
      });
    }).toThrow("Name is required");
  });

  it("should throw error when price is zero or negative", () => {
    expect(() => {
      new InvoiceItems({
        id: new Id("1"),
        name: "Item 1",
        price: 0,
      });
    }).toThrow("Price must be greater than 0");

    expect(() => {
      new InvoiceItems({
        id: new Id("1"),
        name: "Item 1",
        price: -100,
      });
    }).toThrow("Price must be greater than 0");
  });
});
```

## ✅ Checklist de Implementação

- [ ] **1. Estrutura de diretórios criada**
- [ ] **2. Entidades de domínio implementadas**
  - [ ] InvoiceItems Entity
  - [ ] Invoice Entity com validações
- [ ] **3. DTOs definidos**
  - [ ] Find Invoice DTO
  - [ ] Generate Invoice DTO
- [ ] **4. Gateway interface criado**
- [ ] **5. Models do banco implementados**
  - [ ] InvoiceModel
  - [ ] InvoiceItemsModel
- [ ] **6. Repository implementado**
  - [ ] Métodos generate e find
  - [ ] Relacionamento entre Invoice e InvoiceItems
- [ ] **7. Use Cases implementados**
  - [ ] FindInvoiceUseCase
  - [ ] GenerateInvoiceUseCase
- [ ] **8. Facade implementado**
  - [ ] Interface da Facade
  - [ ] Implementação da Facade
- [ ] **9. Factory implementado**
- [ ] **10. Testes implementados**
  - [ ] **10.1** Testes unitários dos Use Cases
    - [ ] FindInvoiceUseCase.spec.ts
    - [ ] GenerateInvoiceUseCase.spec.ts
  - [ ] **10.2** Testes de integração do Repository
    - [ ] InvoiceRepository.spec.ts
  - [ ] **10.3** Testes da Facade
    - [ ] InvoiceFacade.spec.ts
  - [ ] **10.4** Testes das Entidades de Domínio
    - [ ] Invoice.entity.spec.ts
    - [ ] InvoiceItems.entity.spec.ts

## 🚦 Comandos para Execução

```bash
# Executar todos os testes
npm test

# Executar testes específicos do módulo Invoice
npm test -- --testPathPattern=invoice

# Executar testes com coverage
npm test -- --coverage

# Verificar TypeScript
npm run tsc -- --noEmit
```

## 📝 Observações Importantes

1. **Seguir padrões existentes**: Manter consistência com outros módulos
2. **Validações**: Implementar validações tanto nas entidades quanto nos use cases
3. **Relacionamentos**: Configurar corretamente os relacionamentos Sequelize
4. **Testes**: Manter cobertura de 100% seguindo os padrões do projeto
5. **DTOs**: Usar interfaces TypeScript para type safety
6. **Error Handling**: Implementar tratamento de erros consistente

## 🔧 Resolução de Problemas Comuns

### **Erro de Types do Jest**
Se houver erros de types do Jest, certifique-se de que o `tsconfig.json` está configurado corretamente com `"types": ["jest", "node"]`.

### **Problemas com Sequelize**
Certifique-se de registrar os novos models nos testes:
```typescript
await sequelize.addModels([InvoiceModel, InvoiceItemsModel]);
```

### **Relacionamentos Sequelize**
Use `include` nas consultas para buscar dados relacionados:
```typescript
const invoice = await InvoiceModel.findOne({
  where: { id },
  include: [{ model: InvoiceItemsModel }],
});
```

---

Seguindo este guia, você terá um módulo Invoice completo e funcional, seguindo todos os padrões arquiteturais do projeto FC Monolito! 🚀
