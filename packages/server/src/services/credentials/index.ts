import { omit } from 'lodash'
import { StatusCodes } from 'http-status-codes'
import { getRunningExpressApp } from '../../utils/getRunningExpressApp'
import { Credential } from '../../database/entities/Credential'
import { transformToCredentialEntity, decryptCredentialData } from '../../utils'
import { ICredentialReturnResponse } from '../../Interface'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { getErrorMessage } from '../../errors/utils'

const createCredential = async (requestBody: any, userId?: string) => {
    try {
        const appServer = getRunningExpressApp()
        const newCredential = await transformToCredentialEntity(requestBody)
        // 设置用户ID
        if (userId) {
            ;(newCredential as any).userId = userId
        }
        const credential = await appServer.AppDataSource.getRepository(Credential).create(newCredential)
        const dbResponse = await appServer.AppDataSource.getRepository(Credential).save(credential)
        return dbResponse
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: credentialsService.createCredential - ${getErrorMessage(error)}`
        )
    }
}

// Delete credential with user permission check
const deleteCredentials = async (credentialId: string, userId?: string): Promise<any> => {
    try {
        const appServer = getRunningExpressApp()

        // 必须提供 userId
        if (!userId) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, 'User ID is required')
        }

        // 检查权限：所有用户都只能删除自己的凭证
        const credential = await appServer.AppDataSource.getRepository(Credential).findOneBy({ id: credentialId })
        if (!credential) {
            throw new InternalFlowiseError(StatusCodes.NOT_FOUND, `Credential ${credentialId} not found`)
        }
        if (credential.userId !== userId) {
            throw new InternalFlowiseError(StatusCodes.FORBIDDEN, `No permission to delete this credential`)
        }

        const dbResponse = await appServer.AppDataSource.getRepository(Credential).delete({ id: credentialId })
        return dbResponse
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: credentialsService.deleteCredential - ${getErrorMessage(error)}`
        )
    }
}

const getAllCredentials = async (paramCredentialName: any, userId?: string) => {
    try {
        const appServer = getRunningExpressApp()
        let dbResponse = []

        // 必须提供 userId，所有用户都只能看到自己的凭证
        if (!userId) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, 'User ID is required')
        }

        if (paramCredentialName) {
            if (Array.isArray(paramCredentialName)) {
                for (let i = 0; i < paramCredentialName.length; i += 1) {
                    const name = paramCredentialName[i] as string
                    const queryBuilder = appServer.AppDataSource.getRepository(Credential)
                        .createQueryBuilder('c')
                        .where('c.credentialName = :name', { name })
                        .andWhere('c.userId = :userId', { userId })

                    const credentials = await queryBuilder.getMany()
                    dbResponse.push(...credentials)
                }
            } else {
                const queryBuilder = appServer.AppDataSource.getRepository(Credential)
                    .createQueryBuilder('c')
                    .where('c.credentialName = :name', { name: paramCredentialName as string })
                    .andWhere('c.userId = :userId', { userId })

                const credentials = await queryBuilder.getMany()
                dbResponse = [...credentials]
            }
        } else {
            const queryBuilder = appServer.AppDataSource.getRepository(Credential)
                .createQueryBuilder('c')
                .where('c.userId = :userId', { userId })

            const credentials = await queryBuilder.getMany()
            for (const credential of credentials) {
                dbResponse.push(omit(credential, ['encryptedData']))
            }
        }
        return dbResponse
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: credentialsService.getAllCredentials - ${getErrorMessage(error)}`
        )
    }
}

const getCredentialById = async (credentialId: string, userId?: string): Promise<any> => {
    try {
        const appServer = getRunningExpressApp()

        // 必须提供 userId
        if (!userId) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, 'User ID is required')
        }

        const credential = await appServer.AppDataSource.getRepository(Credential).findOneBy({
            id: credentialId
        })
        if (!credential) {
            throw new InternalFlowiseError(StatusCodes.NOT_FOUND, `Credential ${credentialId} not found`)
        }

        // 检查权限：所有用户都只能访问自己的凭证
        if (credential.userId !== userId) {
            throw new InternalFlowiseError(StatusCodes.FORBIDDEN, `No permission to access this credential`)
        }

        // Decrpyt credentialData
        const decryptedCredentialData = await decryptCredentialData(
            credential.encryptedData,
            credential.credentialName,
            appServer.nodesPool.componentCredentials
        )
        const returnCredential: ICredentialReturnResponse = {
            ...credential,
            plainDataObj: decryptedCredentialData
        }
        const dbResponse = omit(returnCredential, ['encryptedData'])
        return dbResponse
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: credentialsService.createCredential - ${getErrorMessage(error)}`
        )
    }
}

const updateCredential = async (credentialId: string, requestBody: any, userId?: string): Promise<any> => {
    try {
        const appServer = getRunningExpressApp()

        // 必须提供 userId
        if (!userId) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, 'User ID is required')
        }

        const credential = await appServer.AppDataSource.getRepository(Credential).findOneBy({
            id: credentialId
        })
        if (!credential) {
            throw new InternalFlowiseError(StatusCodes.NOT_FOUND, `Credential ${credentialId} not found`)
        }

        // 检查权限：所有用户都只能更新自己的凭证
        if (credential.userId !== userId) {
            throw new InternalFlowiseError(StatusCodes.FORBIDDEN, `No permission to update this credential`)
        }

        const decryptedCredentialData = await decryptCredentialData(credential.encryptedData)
        requestBody.plainDataObj = { ...decryptedCredentialData, ...requestBody.plainDataObj }
        const updateCredential = await transformToCredentialEntity(requestBody)
        await appServer.AppDataSource.getRepository(Credential).merge(credential, updateCredential)
        const dbResponse = await appServer.AppDataSource.getRepository(Credential).save(credential)
        return dbResponse
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: credentialsService.updateCredential - ${getErrorMessage(error)}`
        )
    }
}

export default {
    createCredential,
    deleteCredentials,
    getAllCredentials,
    getCredentialById,
    updateCredential
}
