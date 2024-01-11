// Node modules.
import fetch from 'node-fetch';

// Services.
import ServiceCxperium from '.';
import ServiceCxperiumContact from './contact';
import ServiceCxperiumConversation from './conversation';

// Types.
import { TCxperiumLanguage } from '../../types/cxperium/language';
import { TCxperiumServiceParams } from '../../types/cxperium/service';

// Datas.
import DataGeneral from '../../data/general';

export default class extends ServiceCxperium {
	serviceCxperiumContact!: ServiceCxperiumContact;
	serviceCxperiumConversation!: ServiceCxperiumConversation;

	public cache = DataGeneral.cache;

	constructor(data: TCxperiumServiceParams) {
		super(data);
		this.serviceCxperiumContact = new ServiceCxperiumContact(data);
		this.serviceCxperiumConversation = new ServiceCxperiumConversation(
			data,
		);
	}

	async getAllLanguage(): Promise<TCxperiumLanguage[]> {
		const cached: TCxperiumLanguage[] | undefined =
			this.cache.get('GET_ALL_LANGUAGE');

		if (cached) return cached;

		const response = (await fetch(
			`${this.baseUrl}/api/assistant/localization`,
			{
				method: 'GET',
				headers: {
					'content-type': 'application/json',
					apikey: this.apiKey,
				},
			},
		).then((response) => response.json())) as any;

		const languages: TCxperiumLanguage[] = [];
		for (const [, value] of Object.entries(response.data.data) as any) {
			const language: TCxperiumLanguage = {
				id: value.languageId,
				cultureCode: value.cultureCode,
				name: value.name,
				isDefault: Boolean(value.isDefault),
				data: value.data,
			};

			languages.push(language);
		}

		this.cache.set('ALL_LANGUAGES', languages);

		return languages;
	}

	async ClearCache() {
		this.cache.flushAll();
	}

	async getLanguageById(languageId: number) {
		const languages = await this.getAllLanguage();

		for (const language of languages) {
			if (language.id == languageId) return language;
		}
	}

	async getLanguageByKey(languageId: number, key: string) {
		const languages = await this.getAllLanguage();

		for (const language of languages) {
			if (Number(language.id) === languageId) {
				if (key === language.data.key) {
					return language.data.value;
				}
			}
		}

		return null;
	}

	async getDefaultLanguage() {
		let defaultLanguages!: TCxperiumLanguage[];
		const languages = await this.getAllLanguage();

		for (const language of languages) {
			if (Boolean(language.isDefault)) defaultLanguages.push(language);
		}
	}
}
