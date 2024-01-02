// Environment.
const { NODE_ENV } = process.env;

// Node modules.
import fetch from 'node-fetch';

// Services.
import ServiceCxperium from '.';

// Datas.
import DataGeneral from '../../data/general';

// Types.
import { TCxperiumServiceParams } from '../../types/cxperium/service';
import { TCxperiumEnvironment } from '../../types/configuration/environment';

// Utils.
import { TAutomateConfig } from '../../types/configuration/automate';
import { TWhatsappConfig } from '../../types/configuration/whatsapp';
import { TChatGPTConfig } from '../../types/configuration/chatgpt';
import { TCxperiumLiveConfig } from '../../types/configuration/live';
import { TDialogflowConfig } from '../../types/configuration/dialogflow';
import { TGdprConfig } from '../../types/configuration/gdpr';

export default class extends ServiceCxperium {
	private cache = DataGeneral.cache;
	constructor(data: TCxperiumServiceParams) {
		super(data);
	}

	async execute(): Promise<TCxperiumEnvironment> {
		const envFromCache: TCxperiumEnvironment | undefined =
			this.cache.get('CXPERIUM_ENV');

		if (envFromCache) return envFromCache;

		const allEnv = (await this.getAllEnv()) as any;

		const whatsappConfig: TWhatsappConfig = allEnv.WhatsAppConfig;
		const automateConfig: TAutomateConfig = allEnv.AutomateConfig;
		const chatgptConfig: TChatGPTConfig = allEnv.ChatGPTConfig;
		const liveConfig: TCxperiumLiveConfig = allEnv.CxperiumLiveConfig;
		const dialogflowConfig: TDialogflowConfig = allEnv.DialogFlowConfig;
		const gdprConfig: TGdprConfig = allEnv.GdprConfig;
		const extraFields: Record<string, unknown> = {};

		for (const [k, v] of Object.entries(allEnv)) {
			if (
				k !== 'AutomateConfig' &&
				k !== 'ChatGPTConfig' &&
				k !== 'CxperiumLiveConfig' &&
				k !== 'DialogFlowConfig' &&
				k !== 'GdprConfig'
			) {
				extraFields[k] = v;
			}
		}

		const env: TCxperiumEnvironment = {
			automateConfig: automateConfig,
			chatgptConfig: chatgptConfig,
			cxperiumLiveConfig: liveConfig,
			dialogflowConfig: dialogflowConfig,
			gdprConfig: gdprConfig,
			whatsappConfig: whatsappConfig,
			extraFields: extraFields,
		};

		this.cache.set('CXPERIUM_ENV', env);
		return env;
	}

	private async getAllEnv() {
		const response = (await fetch(
			`${this.baseUrl}/api/assistant/configuration`,
			{
				method: 'GET',
				headers: {
					'content-type': 'application/json',
					apikey: this.apiKey,
				},
			},
		).then((response) => response.json())) as any;

		const result = response.data.data.data;
		result.WhatsAppConfig = await this.getWhatsappConfig();

		if (!result.AutomateConfig) {
			throw new Error(
				'AutomateConfig is required to continue to run this project',
			);
		}
		if (!result.ChatGPTConfig) {
			throw new Error(
				'ChatGPTConfig is required to continue to run this project',
			);
		}
		if (!result.GdprConfig) {
			throw new Error(
				'GdprConfig is required to continue to run this project',
			);
		}
		if (!result.CxperiumLiveConfig) {
			throw new Error(
				'CxperiumLiveConfig is required to continue to run this project',
			);
		}
		if (!result.DialogFlowConfig) {
			throw new Error(
				'Automate config is required to continue to run this project',
			);
		}
		if (!result.WhatsAppConfig) {
			if (NODE_ENV === 'development')
				throw new Error(
					'WhatsappDevConfig is required to continue to run this project',
				);
			else
				throw new Error(
					'WhatsappConfig is required to continue to run this project',
				);
		}

		return result;
	}

	private async getWhatsappConfig(): Promise<TWhatsappConfig> {
		let response;
		let whatsappConfig: TWhatsappConfig;

		if (NODE_ENV === 'development') {
			// TODO canli ortamdan donen waba config bilgisi ile dev ortaminda farkli.
			// TODOFatmadan api tarafinda guncelleme bekleniyor.

			response = (await fetch(
				`${this.baseUrl}/api/assistant/whatsapp-config`,
				{
					method: 'GET',
					headers: {
						'content-type': 'application/json',
						apikey: this.apiKey,
					},
				},
			).then((response) => response.json())) as any;

			whatsappConfig = response.data[0];
		} else {
			response = (await fetch(`${this.baseUrl}/api/waba`, {
				method: 'GET',
				headers: {
					'content-type': 'application/json',
					apikey: this.apiKey,
				},
			}).then((response) => response.json())) as any;

			whatsappConfig = response.data[0];
		}

		return whatsappConfig;
	}
}