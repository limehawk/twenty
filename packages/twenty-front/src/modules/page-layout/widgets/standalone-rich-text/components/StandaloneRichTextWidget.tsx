import { useRef } from 'react';

import { type Attachment } from '@/activities/files/types/Attachment';
import { getActivityTargetObjectFieldIdName } from '@/activities/utils/getActivityTargetObjectFieldIdName';
import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { CoreObjectNameSingular, FieldMetadataType } from 'twenty-shared/types';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useIsPageLayoutInEditMode } from '@/page-layout/hooks/useIsPageLayoutInEditMode';
import { pageLayoutEditingWidgetIdComponentState } from '@/page-layout/states/pageLayoutEditingWidgetIdComponentState';
import { type PageLayoutWidget } from '@/page-layout/types/PageLayoutWidget';
import { StandaloneRichTextEditorContent } from '@/page-layout/widgets/standalone-rich-text/components/StandaloneRichTextEditorContent';
import { useLayoutRenderingContext } from '@/ui/layout/contexts/LayoutRenderingContext';
import { ScrollWrapper } from '@/ui/utilities/scroll/components/ScrollWrapper';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';
import { styled } from '@linaria/react';
import { isDefined } from 'twenty-shared/utils';
import { type StandaloneRichTextConfiguration } from '~/generated-metadata/graphql';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledContainer = styled.div<{ isPageLayoutInEditMode?: boolean }>`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  padding-left: ${({ isPageLayoutInEditMode }) =>
    isPageLayoutInEditMode ? themeCssVariables.spacing[5] : 0};
  width: 100%;
`;

type StandaloneRichTextWidgetProps = {
  widget: PageLayoutWidget;
};

export const StandaloneRichTextWidget = ({
  widget,
}: StandaloneRichTextWidgetProps) => {
  const containerElementRef = useRef<HTMLDivElement>(null);
  const isPageLayoutInEditMode = useIsPageLayoutInEditMode();

  const pageLayoutEditingWidgetId = useAtomComponentStateValue(
    pageLayoutEditingWidgetIdComponentState,
  );

  const { targetRecordIdentifier } = useLayoutRenderingContext();
  const { objectMetadataItems } = useObjectMetadataItems();

  const targetObjectMetadataItem = objectMetadataItems.find(
    (objectMetadataItem) =>
      objectMetadataItem.nameSingular ===
      targetRecordIdentifier?.targetObjectNameSingular,
  );

  const hasActiveAttachmentsRelation =
    targetObjectMetadataItem?.fields.some(
      (field) =>
        field.name === 'attachments' &&
        field.isActive === true &&
        (field.type === FieldMetadataType.RELATION ||
          field.type === FieldMetadataType.MORPH_RELATION),
    ) === true;

  const attachmentFilter =
    isDefined(targetRecordIdentifier) && hasActiveAttachmentsRelation
      ? {
          [getActivityTargetObjectFieldIdName({
            nameSingular: targetRecordIdentifier.targetObjectNameSingular,
          })]: { eq: targetRecordIdentifier.id },
        }
      : undefined;

  const configuration = widget.configuration as
    | StandaloneRichTextConfiguration
    | undefined;

  const currentBody = configuration?.body?.blocknote ?? '';

  const { records: attachments } = useFindManyRecords<Attachment>({
    objectNameSingular: CoreObjectNameSingular.Attachment,
    filter: attachmentFilter,
    skip: !isDefined(attachmentFilter),
  });

  const isThisWidgetBeingEdited = pageLayoutEditingWidgetId === widget.id;
  const isEditable = isPageLayoutInEditMode && isThisWidgetBeingEdited;

  return (
    <StyledContainer
      ref={containerElementRef}
      isPageLayoutInEditMode={isPageLayoutInEditMode}
    >
      <ScrollWrapper
        componentInstanceId={`scroll-wrapper-rich-text-widget-${widget.id}`}
      >
        <StandaloneRichTextEditorContent
          key={isEditable ? 'editing' : 'readonly'}
          widget={widget}
          currentBody={currentBody}
          attachments={attachments}
          isEditable={isEditable}
          containerElement={containerElementRef.current}
        />
      </ScrollWrapper>
    </StyledContainer>
  );
};
