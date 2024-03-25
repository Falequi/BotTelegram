import 'dotenv/config';
import { get } from 'env-var'

export const envs = {
    
    PORT: get('PORT').required().asPortNumber(),
    PUBLIC_PATH: get('PUBLIC_PATH').default('public').asString(),
    BOT_TOKEN: get('BOT_TOKEN').required().asString(),
    URL_API: get('URL_API').required().asString(),
}


