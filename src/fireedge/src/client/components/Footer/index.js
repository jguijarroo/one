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
import { memo } from 'react'

import { Link, Typography, styled } from '@mui/material'

import { PATH } from 'client/apps/sunstone/routesOne'
import { Translate } from 'client/components/HOC'
import { StatusChip } from 'client/components/Status'
import { BY, T } from 'client/constants'
import { useCheckOfficialSupportQuery } from 'client/features/OneApi/support'
import { useGetOneVersionQuery } from 'client/features/OneApi/system'
import { Link as RouterLink, generatePath } from 'react-router-dom'

const FooterBox = styled('footer')(({ theme }) => ({
  color: theme.palette.primary.contrastText,
  backgroundColor: theme.palette.primary.light,
  position: 'absolute',
  width: '100%',
  left: 'auto',
  bottom: 0,
  right: 0,
  // zIndex: theme.zIndex.appBar,
  textAlign: 'center',
  padding: theme.spacing(0.6),
}))

const HeartIcon = styled('span')(({ theme }) => ({
  margin: theme.spacing(0, 1),
  color: theme.palette.error.dark,
  '&:before': {
    content: "'❤️'",
  },
}))

const Footer = memo(() => {
  const { isError, isSuccess } = useCheckOfficialSupportQuery()
  const { data: version } = useGetOneVersionQuery()

  return (
    <FooterBox>
      <Typography variant="body2">
        <Translate word={T.MadeWith} />
        <HeartIcon role="img" aria-label="heart-emoji" />
        <Link href={BY.url} color="primary.contrastText">
          {BY.text}
        </Link>
        {version && (
          <StatusChip
            forceWhiteColor
            stateColor="secondary"
            text={version}
            mx={0.5}
          />
        )}
        {isError && (
          <StatusChip
            forceWhiteColor
            stateColor="error"
            text={T.NotOfficiallySupport}
            dataCy="notOfficialSupport"
            mx={0.5}
          />
        )}
        {isSuccess && (
          <Link component={RouterLink} to={generatePath(PATH.SUPPORT)}>
            <StatusChip
              forceWhiteColor
              stateColor="success"
              text={T.OfficiallySupport}
              dataCy="officialSupport"
              mx={0.5}
            />
          </Link>
        )}
      </Typography>
    </FooterBox>
  )
})

Footer.displayName = 'Footer'

export default Footer
