/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
 *                                                                           *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may   *
 * not use this file except in compliance with the License. You may obtain   *
 * a copy of the License at                                                  *
 *                                                                           *
 * http://www.apache.org/licenses/LICENSE-2.0                                *
 *                                                                           *
 * Unless required by applicable law or agreed to in writing, software       *
 * distributed under the License is distributed on an "AS IS" BASIS,         *
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  *
 * See the License for the specific language governing permissions and       *
 * limitations under the License.                                            *
 * ------------------------------------------------------------------------- */
import { reach } from 'yup'

import CustomVariables, {
  STEP_ID as CUSTOM_ID,
} from 'client/components/Forms/VmTemplate/CreateForm/Steps/CustomVariables'
import ExtraConfiguration, {
  STEP_ID as EXTRA_ID,
} from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration'
import General, {
  STEP_ID as GENERAL_ID,
} from 'client/components/Forms/VmTemplate/CreateForm/Steps/General'

import { userInputsToArray } from 'client/models/Helper'
import {
  createSteps,
  encodeBase64,
  getUnknownAttributes,
  isBase64,
} from 'client/utils'

import { KVM_FIRMWARE_TYPES, VCENTER_FIRMWARE_TYPES } from 'client/constants'

/**
 * Encodes the start script value to base64 if it is not already encoded.
 *
 * @param {object} template - VM template
 * @returns {object} Context with the start script value encoded
 */
export const ensureContextWithScript = (template = {}) => {
  template.CONTEXT = ((context = {}) => {
    const { START_SCRIPT, ENCODE_START_SCRIPT, ...restOfContext } = context

    if (!START_SCRIPT) return { ...restOfContext }
    if (!ENCODE_START_SCRIPT) return { ...restOfContext, START_SCRIPT }

    // encode the script if it is not already encoded
    const encodedScript = isBase64(START_SCRIPT)
      ? START_SCRIPT
      : encodeBase64(START_SCRIPT)

    return { ...restOfContext, START_SCRIPT_BASE64: encodedScript }
  })(template.CONTEXT)

  return { ...template }
}

const Steps = createSteps([General, ExtraConfiguration, CustomVariables], {
  transformInitialValue: (vmTemplate, schema) => {
    const userInputs = userInputsToArray(vmTemplate?.TEMPLATE?.USER_INPUTS, {
      order: vmTemplate?.TEMPLATE?.INPUTS_ORDER,
    })

    const objectSchema = {
      [GENERAL_ID]: { ...vmTemplate, ...vmTemplate?.TEMPLATE },
      [EXTRA_ID]: {
        ...vmTemplate?.TEMPLATE,
        USER_INPUTS: userInputs,
      },
    }

    // cast CPU_MODEL/FEATURES
    if (vmTemplate?.TEMPLATE?.CPU_MODEL?.FEATURES) {
      objectSchema[EXTRA_ID].CPU_MODEL = {
        ...vmTemplate?.TEMPLATE?.CPU_MODEL,
        FEATURES: (vmTemplate?.TEMPLATE?.CPU_MODEL?.FEATURES ?? '').split(','),
      }
    }

    // cast FIRMWARE
    const firmware = vmTemplate?.TEMPLATE?.OS?.FIRMWARE
    if (firmware) {
      const firmwareOption =
        KVM_FIRMWARE_TYPES.includes(firmware) ||
        VCENTER_FIRMWARE_TYPES.includes(firmware)

      objectSchema[EXTRA_ID].OS = {
        ...vmTemplate?.TEMPLATE?.OS,
        FEATURE_CUSTOM_ENABLED: !firmwareOption ? 'YES' : 'NO',
      }
    }

    const knownTemplate = schema.cast(objectSchema, {
      stripUnknown: true,
      context: { ...vmTemplate, [EXTRA_ID]: vmTemplate.TEMPLATE },
    })

    const knownAttributes = {
      ...knownTemplate[GENERAL_ID],
      ...knownTemplate[EXTRA_ID],
    }

    // Set the unknown attributes to the custom variables section
    knownTemplate[CUSTOM_ID] = getUnknownAttributes(
      vmTemplate?.TEMPLATE,
      knownAttributes
    )

    // Get the custom vars from the context
    const knownContext = reach(schema, `${EXTRA_ID}.CONTEXT`).cast(
      vmTemplate?.TEMPLATE?.CONTEXT,
      {
        stripUnknown: true,
        context: {
          ...vmTemplate,
          [EXTRA_ID]: vmTemplate.TEMPLATE,
        },
      }
    )

    // Merge known and unknown context custom vars
    knownTemplate[EXTRA_ID].CONTEXT = {
      ...knownContext,
      ...getUnknownAttributes(vmTemplate?.TEMPLATE?.CONTEXT, knownContext),
    }

    return knownTemplate
  },
  transformBeforeSubmit: (formData) =>
    // All formatting and parsing is taken care of in the VmTemplate container
    formData,
})

export default Steps
