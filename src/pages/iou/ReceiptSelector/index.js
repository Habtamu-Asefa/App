import {View, Text, PixelRatio} from 'react-native';
import React, {useCallback, useRef, useState} from 'react';
import lodashGet from 'lodash/get';
import PropTypes from 'prop-types';
import * as IOU from '../../../libs/actions/IOU';
import reportPropTypes from '../../reportPropTypes';
import personalDetailsPropType from '../../personalDetailsPropType';
import CONST from '../../../CONST';
import withCurrentUserPersonalDetails, {withCurrentUserPersonalDetailsDefaultProps} from '../../../components/withCurrentUserPersonalDetails';
import ReceiptUpload from '../../../../assets/images/receipt-upload.svg';
import PressableWithFeedback from '../../../components/Pressable/PressableWithFeedback';
import Button from '../../../components/Button';
import styles from '../../../styles/styles';
import CopyTextToClipboard from '../../../components/CopyTextToClipboard';
import ReceiptDropUI from '../ReceiptDropUI';
import AttachmentPicker from '../../../components/AttachmentPicker';
import NavigateToNextIOUPage from '../NavigateToNextIOUPage';
import withLocalize, {withLocalizePropTypes} from '../../../components/withLocalize';
import ConfirmModal from '../../../components/ConfirmModal';
import _, {compose} from 'underscore';
import AttachmentUtils from '../../../libs/AttachmentUtils';
import {withOnyx} from 'react-native-onyx';
import ONYXKEYS from '../../../ONYXKEYS';
import Receipt from '../../../libs/actions/Receipt';

const propTypes = {
    /** Route params */
    route: PropTypes.shape({
        params: PropTypes.shape({
            iouType: PropTypes.string,
            reportID: PropTypes.string,
        }),
    }),

    /** The report on which the request is initiated on */
    report: reportPropTypes,

    /** Holds data related to Money Request view state, rather than the underlying Money Request data. */
    iou: PropTypes.shape({
        id: PropTypes.string,
        amount: PropTypes.number,
        currency: PropTypes.string,
        participants: PropTypes.arrayOf(
            PropTypes.shape({
                accountID: PropTypes.number,
                login: PropTypes.string,
                isPolicyExpenseChat: PropTypes.bool,
                isOwnPolicyExpenseChat: PropTypes.bool,
                selected: PropTypes.bool,
            }),
        ),
    }),

    /** Current user personal details */
    currentUserPersonalDetails: personalDetailsPropType,

    /** Used by drag and drop to determine if we have a file dragged over the view */
    isDraggingOver: PropTypes.bool,

    ...withLocalizePropTypes,
};

const defaultProps = {
    route: {
        params: {
            iouType: '',
            reportID: '',
        },
    },
    report: {},
    iou: {
        id: '',
        amount: 0,
        currency: CONST.CURRENCY.USD,
        participants: [],
    },
    ...withCurrentUserPersonalDetailsDefaultProps,
    isDraggingOver: false,
};

function ReceiptSelector(props) {
    const iouType = useRef(lodashGet(props.route, 'params.iouType', ''));
    const reportID = useRef(lodashGet(props.route, 'params.reportID', ''));
    const isAttachmentInvalid = lodashGet(props.receiptModal, 'isAttachmentInvalid', false);
    const attachmentInvalidReasonTitle = lodashGet(props.receiptModal, 'attachmentInvalidReasonTitle', '');
    const attachmentInvalidReason = lodashGet(props.receiptModal, 'attachmentInvalidReason', '');
    const [receiptImageTopPosition, setReceiptImageTopPosition] = useState(0);

    /**
     * Close the confirm modal.
     */
    const closeConfirmModal = useCallback(() => {
        Receipt.clearUploadReceiptError();
    }, []);

    const defaultView = () => (
        <>
            <View
                onLayout={({nativeEvent}) => {
                    setReceiptImageTopPosition(PixelRatio.roundToNearestPixel(nativeEvent.layout.top));
                }}
            >
                <ReceiptUpload
                    width={CONST.RECEIPT.ICON_SIZE}
                    height={CONST.RECEIPT.ICON_SIZE}
                />
            </View>
            <Text style={[styles.textReceiptUpload]}>{props.translate('receipt.upload')}</Text>
            <Text style={[styles.subTextReceiptUpload]}>
                {props.translate('receipt.dragReceiptBeforeEmail')}
                <View style={{flexDirection: 'row'}}>
                    <CopyTextToClipboard
                        text="receipts@expensify.com"
                        textStyles={[styles.textBlue]}
                    />
                </View>
                {props.translate('receipt.dragReceiptAfterEmail')}
            </Text>
            <AttachmentPicker>
                {({openPicker}) => (
                    <PressableWithFeedback
                        accessibilityLabel={props.translate('receipt.chooseFile')}
                        accessibilityRole="button"
                    >
                        <Button
                            medium
                            success
                            text={props.translate('receipt.chooseFile')}
                            style={[styles.buttonReceiptUpload]}
                            onPress={() => {
                                openPicker({
                                    onPicked: (file) => {
                                        if (!AttachmentUtils.isValidFile(file, props)) {
                                            return;
                                        }

                                        const filePath = URL.createObjectURL(file);
                                        IOU.setMoneyRequestReceipt(filePath);
                                        NavigateToNextIOUPage(props.iou, iouType, reportID, props.report, props.currentUserPersonalDetails);
                                    },
                                });
                            }}
                        />
                    </PressableWithFeedback>
                )}
            </AttachmentPicker>
        </>
    );

    return (
        <View style={[styles.uploadReceiptView]}>
            {!props.isDraggingOver ? defaultView() : null}
            {props.isDraggingOver && <ReceiptDropUI receiptImageTopPosition={receiptImageTopPosition} />}
            <ConfirmModal
                title={attachmentInvalidReasonTitle}
                onConfirm={closeConfirmModal}
                onCancel={closeConfirmModal}
                isVisible={isAttachmentInvalid}
                prompt={attachmentInvalidReason}
                confirmText={props.translate('common.close')}
                shouldShowCancelButton={false}
            />
        </View>
    );
}

ReceiptSelector.defaultProps = defaultProps;
ReceiptSelector.propTypes = propTypes;
ReceiptSelector.displayName = 'ReceiptSelector';

export default compose(
    withLocalize,
    withOnyx({
        receiptModal: {key: ONYXKEYS.RECEIPT_MODAL},
    }),
)(ReceiptSelector);
