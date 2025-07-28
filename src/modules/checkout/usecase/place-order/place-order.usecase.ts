import Id from "../../../@shared/domain/value-object/id.value-object";
import UseCaseInterface from "../../../@shared/usecase/use-case.interface";
import Client from "../../../client-adm/domain/client.entity";
import ClientAdmFacadeInterface from "../../../client-adm/facade/client-adm.facade.interface";
import ProductAdmFacadeInterface from "../../../product-adm/facade/product-adm.facade.interface";
import StoreCatalogFacadeInterface from "../../../store-catalog/facade/store-catalog.facade.interface";
import Order from "../../domain/order.entity";
import Product from "../../domain/product.entity";
import { PlaceOrderInputDto, PlaceOrderOutputDto } from "./place-order.dto";

export default class PlaceOrderUseCase implements UseCaseInterface {

	private _clientFacade: ClientAdmFacadeInterface;
	private _productFacade: ProductAdmFacadeInterface;
	private _catalogFacade: StoreCatalogFacadeInterface;

	constructor(clientFacade: ClientAdmFacadeInterface, productFacade: ProductAdmFacadeInterface, catalogFacade: StoreCatalogFacadeInterface) {
		this._clientFacade = clientFacade;
		this._productFacade = productFacade;
		this._catalogFacade = catalogFacade;
	}

	async execute(input: PlaceOrderInputDto): Promise<PlaceOrderOutputDto> {

		const client = await this._clientFacade.find({ id: input.clientId });

		if (!client) {
			throw new Error("Client not found");
		}

		await this.validateProducts(input);

		const products = await Promise.all(
			input.products.map((p) => this.getProduct(p.productId))
		);

		const myClient = new Client({
			id: new Id(client.id),
			name: client.name,
			email: client.email,
			document: client.document,
			address: client.address,
		});

		const order = new Order({
			client: myClient,
			products,
		});

		return {
			id: "",
			invoiceId: "",
			status: "",
			total: 0,
			products: [],
		};
	}

	private async validateProducts(input: PlaceOrderInputDto): Promise<void> {
		if (input.products.length === 0) {
			throw new Error("No products selected");
		}

		for (const p of input.products) {
			const product = await this._productFacade.checkStock({ productId: p.productId });
			if (product.stock <= 0) {
				throw new Error(
					`Product ${product.productId} is out of stock`
				);
			}
		}

	}

	private async getProduct(productId: string): Promise<Product> {
		const product = await this._catalogFacade.find({ id: productId });
		if (!product) {
			throw new Error(`Product not found`);
		}

		const productProps = {
			id: new Id(product.id),
			name: product.name,
			description: product.description,
			salesPrice: product.salesPrice,
		};
		return new Product(productProps);
	}

}

