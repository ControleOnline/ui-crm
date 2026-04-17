import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  modalOverlay: { flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'center', alignItems:'center' },
  modalContent: { backgroundColor:'#FFF', borderRadius:16, width:'90%', maxHeight:'80%', elevation:10, paddingBottom:8 },
  modalHeader:{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:20, paddingVertical:16, borderBottomWidth:1, borderBottomColor:'#E9ECEF' },
  modalTitle:{ fontSize:20, fontWeight:'600', color:'#1A1A1A' },
  modalBody:{ paddingHorizontal:20, paddingVertical:16 },
  inputGroup:{ marginBottom:20 },
  inputLabel:{ fontSize:16, fontWeight:'500', color:'#1A1A1A', marginBottom:8 },
  selectInputText:{ fontSize:16, flex:1 },
  selectOption:{ flexDirection:'row', alignItems:'center', paddingHorizontal:12, paddingVertical:12, borderWidth:1, borderColor:'#E0E0E0', borderRadius:8, marginBottom:4 },
  selectOptionActive:{ backgroundColor:'#F8F9FF' },
  selectOptionTextActive:{ color:'#2529a1', fontWeight:'600' },
  textInput:{ borderWidth:1, borderColor:'#E0E0E0', borderRadius:8, paddingHorizontal:12, paddingVertical:12, fontSize:16, color:'#1A1A1A', backgroundColor:'#FFF' },
  modalFooter:{ flexDirection:'row', justifyContent:'space-between', paddingHorizontal:20, paddingVertical:16, borderTopWidth:1, borderTopColor:'#E9ECEF' },
  cancelButton:{ flex:1, paddingVertical:12, marginRight:8, borderRadius:8, borderWidth:1, borderColor:'#E0E0E0', alignItems:'center' },
  cancelButtonText:{ fontSize:16, fontWeight:'600', color:'#666' },
  createButton:{ flex:1, flexDirection:'row', paddingVertical:12, marginLeft:8, borderRadius:8, backgroundColor:'#2529a1', alignItems:'center', justifyContent:'center' },
  createButtonDisabled:{ backgroundColor:'#CCC' },
  createButtonText:{ fontSize:16, fontWeight:'600', color:'#FFF' },
});

export default styles;

export const inlineStyle_11_8 = {
  marginBottom: 20,
};

export const inlineStyle_21_14 = {
  flexDirection: 'row',
  alignItems: 'center',
  flex: 1,
};

export const inlineStyle_22_71 = {
  marginRight: 8,
};

export const inlineStyle_137_56 = {
  marginRight: 8,
};

