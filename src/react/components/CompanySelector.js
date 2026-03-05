import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    Platform,
    Animated,
    Dimensions,
    Image,
} from 'react-native';
import { useStore } from '@store';
import Icon from 'react-native-vector-icons/Feather';
import {colors} from '@controleonline/../../src/styles/colors';
import {
    buildAssetUrl,
    resolveThemePalette,
    withOpacity,
} from '@controleonline/../../src/styles/branding';
import translateWithFallback from '../utils/translateWithFallback';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function CompanySelector({ mode = 'default', children }) {
    const tr = (type, key, fallback) =>
        translateWithFallback('people', type, key, fallback);
    const [modalVisible, setModalVisible] = useState(false);
    const [overlayOpacity] = useState(() => new Animated.Value(0));
    const [slideY] = useState(() => new Animated.Value(SCREEN_HEIGHT));
    const peopleStore = useStore('people');
    const themeStore = useStore('theme');
    const { currentCompany, companies, isLoading } = peopleStore.getters;
    const {colors: themeColors} = themeStore.getters;
    const peopleActions = peopleStore.actions;
    const brandColors = useMemo(
        () =>
            resolveThemePalette(
                {
                    ...themeColors,
                    ...(currentCompany?.theme?.colors || {}),
                },
                colors,
            ),
        [themeColors, currentCompany?.id],
    );
    const styles = useMemo(() => createStyles(brandColors), [brandColors]);
    const currentCompanyLogoUrl = buildAssetUrl(currentCompany?.logo);
    const triggerChildren = useMemo(
        () =>
            React.Children.toArray(children).filter(child => {
                if (child == null || typeof child === 'boolean') return false;
                if (typeof child === 'string') {
                    const trimmed = child.trim();
                    return trimmed.length > 0 && trimmed !== '.';
                }
                if (typeof child === 'number') return false;
                return true;
            }),
        [children],
    );
    const hasCustomTrigger = triggerChildren.length > 0;

    useEffect(() => {
        if (!companies || companies.length === 0) {
            peopleActions.myCompanies();
        }
    }, []);

    const openModal = useCallback(() => {
        setModalVisible(true);
        overlayOpacity.setValue(1);
        slideY.setValue(SCREEN_HEIGHT);
        Animated.spring(slideY, {
            toValue: 0,
            damping: 24,
            stiffness: 300,
            useNativeDriver: true,
        }).start();
    }, [overlayOpacity, slideY]);

    const closeModal = useCallback(() => {
        Animated.parallel([
            Animated.timing(overlayOpacity, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            }),
            Animated.timing(slideY, {
                toValue: SCREEN_HEIGHT,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => setModalVisible(false));
    }, [overlayOpacity, slideY]);

    const handleSelectCompany = (company) => {
        peopleActions.setCurrentCompany(company);
        closeModal();
    };

    const renderCompanyItem = ({ item }) => {
        const logoUrl = buildAssetUrl(item?.logo);
        const isSelected = currentCompany?.id === item.id;

        return (
            <TouchableOpacity
                style={[
                    styles.companyItem,
                    isSelected && styles.selectedItem,
                ]}
                onPress={() => handleSelectCompany(item)}>
                <View style={styles.companyIcon}>
                    {logoUrl ? (
                        <Image
                            source={{ uri: logoUrl }}
                            style={styles.companyLogo}
                            resizeMode="cover"
                        />
                    ) : (
                        <Icon name="briefcase" size={20} color={brandColors.primary} />
                    )}
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[
                        styles.companyName,
                        isSelected && styles.selectedText
                    ]}>
                        {item.alias || item.name}
                    </Text>
                    {item.document && (
                        <Text style={[
                            styles.companyDocument,
                            isSelected && styles.selectedTextSub
                        ]}>
                            {item.document}
                        </Text>
                    )}
                </View>
                {isSelected && (
                    <Icon name="check" size={20} color={brandColors.primary} />
                )}
            </TouchableOpacity>
        );
    };

    return (
        <>
            {hasCustomTrigger ? (
                <TouchableOpacity onPress={openModal} activeOpacity={0.7}>
                    {triggerChildren}
                </TouchableOpacity>
            ) : mode === 'icon' ? (
                <TouchableOpacity
                    onPress={openModal}
                    style={{ marginRight: 15 }}>
                    {currentCompanyLogoUrl ? (
                        <Image
                            source={{ uri: currentCompanyLogoUrl }}
                            style={styles.headerCompanyLogo}
                            resizeMode="cover"
                        />
                    ) : (
                        <Icon name="briefcase" size={24} color={brandColors.text} />
                    )}
                </TouchableOpacity>
            ) : (
                <TouchableOpacity
                    style={styles.selectorButton}
                    onPress={openModal}
                    activeOpacity={0.7}>
                    <View style={styles.iconContainer}>
                        {currentCompanyLogoUrl ? (
                            <Image
                                source={{ uri: currentCompanyLogoUrl }}
                                style={styles.selectorCompanyLogo}
                                resizeMode="cover"
                            />
                        ) : (
                            <Icon name="briefcase" size={16} color={brandColors.primary} />
                        )}
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={styles.label}>{tr('label', 'company', 'EMPRESA')}</Text>
                        <Text style={styles.currentName} numberOfLines={1}>
                            {currentCompany?.alias || currentCompany?.name || tr('placeholder', 'selectCompany', 'Selecione uma empresa')}
                        </Text>
                    </View>
                    <Icon name="chevron-down" size={16} color={brandColors.textSecondary} />
                </TouchableOpacity>
            )}

            <Modal
                visible={modalVisible}
                animationType="none"
                transparent={true}
                onRequestClose={closeModal}>
                <View style={styles.modalOverlay}>
                    <Animated.View style={[StyleSheet.absoluteFillObject, styles.overlayBg, { opacity: overlayOpacity }]} />
                    <Animated.View style={[styles.modalContent, { transform: [{ translateY: slideY }] }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {tr('title', 'selectCompany', 'Selecionar Empresa')}
                            </Text>
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={closeModal}>
                                <Icon name="x" size={24} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        {isLoading && (!companies || companies.length === 0) ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color={brandColors.primary} />
                            </View>
                        ) : (
                            <FlatList
                                data={companies}
                                keyExtractor={(item) => String(item.id)}
                                renderItem={renderCompanyItem}
                                contentContainerStyle={styles.listContent}
                                showsVerticalScrollIndicator={false}
                            />
                        )}
                    </Animated.View>
                </View>
            </Modal>
        </>
    );
}

const createStyles = brandColors =>
    StyleSheet.create({
    selectorButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 8,
        borderWidth: 1,
        borderColor: '#EEF2FF',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
            },
            android: {
                elevation: 2,
            },
            web: {
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            },
        }),
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: withOpacity(brandColors.primary, 0.12),
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    textContainer: {
        flex: 1,
        marginRight: 10,
    },
    label: {
        fontSize: 10,
        color: '#94A3B8',
        fontWeight: '600',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    currentName: {
        fontSize: 13,
        color: brandColors.text,
        fontWeight: '700',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    overlayBg: {
        backgroundColor: 'rgba(15, 23, 42, 0.4)',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: '80%',
        width: '100%',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
            },
            android: {
                elevation: 10,
            },
            web: {
                boxShadow: '0 -4px 12px rgba(0,0,0,0.1)',
            },
        }),
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
    },
    closeButton: {
        padding: 4,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    listContent: {
        padding: 16,
    },
    companyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    selectedItem: {
        backgroundColor: withOpacity(brandColors.primary, 0.1),
        borderColor: brandColors.primary,
    },
    companyIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    companyLogo: {
        width: 32,
        height: 32,
        borderRadius: 8,
    },
    selectorCompanyLogo: {
        width: 20,
        height: 20,
        borderRadius: 6,
    },
    headerCompanyLogo: {
        width: 24,
        height: 24,
        borderRadius: 6,
    },
    companyName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#334155',
        marginBottom: 2,
    },
    selectedText: {
        color: brandColors.primary,
    },
    companyDocument: {
        fontSize: 12,
        color: '#94A3B8',
    },
    selectedTextSub: {
        color: withOpacity(brandColors.primary, 0.75),
    },
    });
