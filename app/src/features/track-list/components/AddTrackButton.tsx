import styled from "@emotion/styled"
import Add from "mdi-react/AddIcon"
import type { FC } from "react"
import { Localized } from "../../../localize/useLocalization"
import { useTrackList } from "../hooks/useTrackList"

const Wrapper = styled.button`
  display: flex;
  min-width: 0;
  padding: 0.5rem;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid var(--color-divider);
  color: var(--color-text-secondary);
  border-radius: 0.4rem;
  cursor: pointer;

  &:hover {
    background: var(--color-highlight);
  }
`

const AddIcon = styled(Add)`
  min-width: auto;
  flex-shrink: 0;
  margin-right: 0.5em;
  color: inherit;
`

const Label = styled.span`
  font-size: 0.875rem;
  white-space: nowrap;
`

export const AddTrackButton: FC = () => {
  const { addTrack } = useTrackList()

  return (
    <Wrapper
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={addTrack}
    >
      <AddIcon />
      <Label>
        <Localized name="add-track" />
      </Label>
    </Wrapper>
  )
}
